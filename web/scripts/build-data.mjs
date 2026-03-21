import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Resolve a path relative to this script file (not the process CWD).
 * Required because the workflow runs: node web/scripts/build-data.mjs from repo root.
 */
function rel(...parts) {
  return resolve(__dirname, ...parts)
}

const PROJECTS_CSV    = rel('../../projects.csv')
const GITHUB_DATA_CSV = rel('../../github_data.csv')
const OUTPUT_JSON     = rel('../public/projects.json')

// --- Parse projects.csv ---
const projectsRaw = readFileSync(PROJECTS_CSV, 'utf-8')
const { data: projects, errors: pErrors } = Papa.parse(projectsRaw, { header: true, skipEmptyLines: true })
if (pErrors.length) {
  console.error('projects.csv parse errors:', pErrors)
  process.exit(1)
}

// --- Parse github_data.csv (optional) ---
let commitMap = new Map()   // url -> { last_commit, stars }
if (existsSync(GITHUB_DATA_CSV)) {
  const raw = readFileSync(GITHUB_DATA_CSV, 'utf-8')
  const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true })
  for (const row of data) {
    if (row.url) {
      commitMap.set(row.url.trim(), {
        last_commit: row.last_commit?.trim() || null,
        stars: row.stars?.trim() ? parseInt(row.stars.trim(), 10) : null,
      })
    }
  }
  console.log(`Loaded ${commitMap.size} github data entries`)
} else {
  console.warn(`WARN: github_data.csv not found — last_commit and stars will be null`)
}

const SECTION_NAMES = new Set(['R', 'CPP', 'Csharp', 'Rust', 'Ruby', 'Scala', 'Golang'])

// --- Merge ---
const merged = projects.map(row => {
  // Split section "Python > Numerical Libraries" into section + subsection
  const rawSection = row.section?.trim() ?? ''
  const gtIdx = rawSection.indexOf(' > ')
  let section = ''
  let subsection = ''

  if (gtIdx !== -1) {
    section = rawSection.slice(0, gtIdx).trim()
    subsection = rawSection.slice(gtIdx + 3).trim()
  } else {
    // No ' > ' separator
    if (SECTION_NAMES.has(rawSection)) {
      section = rawSection   // e.g. "R" or "Rust" alone is a section
      subsection = ''
    } else {
      section = ''           // no recognizable section
      subsection = rawSection
    }
  }

  const ghData = commitMap.get(row.url?.trim())
  return {
    project:     row.project?.trim() ?? '',
    section:     section,
    subsection:  subsection,
    url:         row.url?.trim() ?? '',
    description: row.description?.trim() ?? '',
    github:      row.github?.trim() === 'True',
    cran:        row.cran?.trim() === 'True',
    last_commit: ghData?.last_commit ?? null,
    stars:       ghData?.stars ?? null,
  }
})

// --- Write output ---
writeFileSync(OUTPUT_JSON, JSON.stringify(merged, null, 2))
console.log(`Wrote ${merged.length} projects to ${OUTPUT_JSON}`)
