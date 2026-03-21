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

const PROJECTS_CSV    = rel('../../data/projects.csv')
const GITHUB_DATA_CSV = rel('../../data/github_data.csv')
const NOT_FOUND_CSV   = rel('../../data/404.csv')
const OUTPUT_JSON     = rel('../public/projects.json')

// --- Parse projects.csv ---
const projectsRaw = readFileSync(PROJECTS_CSV, 'utf-8')
const { data: projects, errors: pErrors } = Papa.parse(projectsRaw, { header: true, skipEmptyLines: true })
if (pErrors.length) {
  console.error('projects.csv parse errors:', pErrors)
  process.exit(1)
}

// --- Load 404 blocklist (optional) ---
let notFoundUrls = new Set()
if (existsSync(NOT_FOUND_CSV)) {
  const raw = readFileSync(NOT_FOUND_CSV, 'utf-8')
  const lines = raw.trim().split('\n').slice(1) // skip header
  for (const line of lines) {
    const url = line.replace(/"/g, '').trim()
    if (url) notFoundUrls.add(url)
  }
  console.log(`Loaded ${notFoundUrls.size} 404 URLs to exclude`)
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

const KNOWN_LANGUAGES = new Set([
  'R', 'CPP', 'CSharp', 'Csharp', 'Julia', 'Rust', 'Ruby', 'Scala', 'Golang',
  'Python', 'Javascript', 'JavaScript', 'Java', 'Matlab',
  'Haskell', 'Elixir/Erlang',
])

// --- Merge (exclude 404 projects) ---
const merged = projects.filter(row => !notFoundUrls.has(row.url?.trim())).map(row => {
  // Split section "Python > Numerical Libraries" into language + category
  const rawSection = row.section?.trim() ?? ''
  const gtIdx = rawSection.indexOf(' > ')
  let language = ''
  let category = ''

  if (gtIdx !== -1) {
    language = rawSection.slice(0, gtIdx).trim()
    category = rawSection.slice(gtIdx + 3).trim()
  } else {
    if (KNOWN_LANGUAGES.has(rawSection)) {
      language = rawSection
      category = ''
    } else {
      language = ''
      category = rawSection
    }
  }

  const ghData = commitMap.get(row.url?.trim())
  return {
    project:     row.project?.trim() ?? '',
    language:    language,
    category:    category,
    url:         row.url?.trim() ?? '',
    description: row.description?.trim() ?? '',
    github:      row.github?.trim().startsWith('https://github.com/') ? row.github.trim() : null,
    last_commit: ghData?.last_commit ?? null,
    stars:       ghData?.stars ?? null,
  }
})

// --- Write output ---
writeFileSync(OUTPUT_JSON, JSON.stringify(merged, null, 2))
console.log(`Wrote ${merged.length} projects to ${OUTPUT_JSON}`)
