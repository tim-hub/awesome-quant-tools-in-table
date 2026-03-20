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

const PROJECTS_CSV  = rel('../../projects.csv')
const COMMITS_CSV   = rel('../../last_commit_times.csv')
const OUTPUT_JSON   = rel('../public/projects.json')

// --- Parse projects.csv ---
const projectsRaw = readFileSync(PROJECTS_CSV, 'utf-8')
const { data: projects, errors: pErrors } = Papa.parse(projectsRaw, { header: true, skipEmptyLines: true })
if (pErrors.length) {
  console.error('projects.csv parse errors:', pErrors)
  process.exit(1)
}

// --- Parse last_commit_times.csv (optional) ---
let commitMap = new Map()
if (existsSync(COMMITS_CSV)) {
  const commitsRaw = readFileSync(COMMITS_CSV, 'utf-8')
  const { data: commits } = Papa.parse(commitsRaw, { header: true, skipEmptyLines: true })
  for (const row of commits) {
    if (row.url && row.last_commit) {
      commitMap.set(row.url.trim(), row.last_commit.trim())
    }
  }
  console.log(`Loaded ${commitMap.size} commit times`)
} else {
  console.warn(`WARN: ${COMMITS_CSV} not found — last_commit will be null for all projects`)
}

// --- Merge ---
const merged = projects.map(row => ({
  project:     row.project?.trim() ?? '',
  section:     row.section?.trim() ?? '',
  url:         row.url?.trim() ?? '',
  description: row.description?.trim() ?? '',
  github:      row.github?.trim() === 'True',
  cran:        row.cran?.trim() === 'True',
  last_commit: commitMap.get(row.url?.trim()) ?? null,
}))

// --- Write output ---
writeFileSync(OUTPUT_JSON, JSON.stringify(merged, null, 2))
console.log(`Wrote ${merged.length} projects to ${OUTPUT_JSON}`)
