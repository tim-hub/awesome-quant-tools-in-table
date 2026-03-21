#!/usr/bin/env node
/**
 * Validates projects.csv format. Used in CI on PRs that modify projects.csv.
 * Exits 0 on success, 1 on failure with clear error messages.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = resolve(__dirname, '../data/projects.csv')

const REQUIRED_HEADERS = ['project', 'section', 'url', 'description', 'github']
const BOOL_VALUES = new Set(['True', 'False', ''])

function parseCSVLine(line) {
  const fields = []
  let i = 0, inQuote = false, field = ''
  while (i <= line.length) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if ((ch === ',' || i === line.length) && !inQuote) {
      fields.push(field)
      field = ''
    } else {
      field += (ch ?? '')
    }
    i++
  }
  return fields
}

function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8')
  const lines = raw.trim().split('\n')
  const errors = []

  // Check headers
  const headers = lines[0].split(',').map(h => h.trim())
  for (const req of REQUIRED_HEADERS) {
    if (!headers.includes(req)) {
      errors.push(`Missing required column: "${req}"`)
    }
  }
  if (errors.length) {
    console.error('CSV validation FAILED:\n')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  const colIdx = Object.fromEntries(headers.map((h, i) => [h, i]))

  // Validate each row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const lineNum = i + 1
    const fields = parseCSVLine(line)

    if (fields.length !== headers.length) {
      errors.push(`Line ${lineNum}: expected ${headers.length} columns, got ${fields.length}`)
      continue
    }

    const project = fields[colIdx.project]?.trim()
    const url = fields[colIdx.url]?.trim()
    const github = fields[colIdx.github]?.trim()

    if (!project) errors.push(`Line ${lineNum}: "project" is required`)
    if (url && !url.startsWith('http')) errors.push(`Line ${lineNum}: "url" must start with http — got "${url}"`)
    if (github && !BOOL_VALUES.has(github) && !github.startsWith('https://github.com/')) {
      errors.push(`Line ${lineNum}: "github" must be a GitHub URL, True, False, or empty — got "${github}"`)
    }
  }

  if (errors.length) {
    console.error(`CSV validation FAILED (${errors.length} error${errors.length > 1 ? 's' : ''}):\n`)
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  const dataRows = lines.slice(1).filter(l => l.trim()).length
  console.log(`CSV validation PASSED: ${dataRows} rows, ${headers.length} columns`)
}

main()
