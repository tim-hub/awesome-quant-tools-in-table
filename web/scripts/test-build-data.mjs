import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Run build-data against fixtures
const fixtureProjects = resolve(__dirname, 'test-fixtures/projects.csv')
const fixtureCommits  = resolve(__dirname, 'test-fixtures/last_commit_times.csv')

const projects = Papa.parse(readFileSync(fixtureProjects, 'utf-8'), { header: true, skipEmptyLines: true }).data
const commits  = Papa.parse(readFileSync(fixtureCommits,  'utf-8'), { header: true, skipEmptyLines: true }).data

const commitMap = new Map(commits.map(r => [r.url.trim(), r.last_commit.trim()]))

const merged = projects.map(row => ({
  project:     row.project.trim(),
  section:     row.section.trim(),
  url:         row.url.trim(),
  description: row.description.trim(),
  github:      row.github.trim() === 'True',
  cran:        row.cran.trim() === 'True',
  last_commit: commitMap.get(row.url.trim()) ?? null,
}))

// Assertions
console.assert(merged.length === 2, 'Expected 2 projects')
console.assert(merged[0].project === 'ArcticDB', 'First project is ArcticDB')
console.assert(merged[0].github === true, 'ArcticDB github flag is boolean true')
console.assert(merged[0].last_commit === '2025-12-30', 'ArcticDB has last_commit')
console.assert(merged[1].project === 'numpy', 'Second project is numpy')
console.assert(merged[1].github === false, 'numpy github flag is boolean false')
console.assert(merged[1].last_commit === null, 'numpy has no last_commit')
console.log('All assertions passed.')
