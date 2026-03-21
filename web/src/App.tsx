import { useState, useEffect, useMemo } from 'react'
import { Filters } from './components/Filters'
import { ThemeToggle } from './components/ThemeToggle'
import { ToolsTable } from './components/ToolsTable'
import type { Project } from './types'

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/projects.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Project[]) => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const languages = useMemo(
    () => [...new Set(projects.map(p => p.language).filter(Boolean))].sort(),
    [projects]
  )
  const sections = useMemo(
    () => [...new Set(projects.map(p => p.section).filter(Boolean))].sort(),
    [projects]
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-eyebrow">
          <span className="eyebrow-badge">Curated</span>
          <span className="eyebrow-divider">·</span>
          <span className="eyebrow-stat">{projects.length} instruments</span>
        </div>
        <h1 className="app-title">
          Awesome <span>Quant</span>
        </h1>
        <p className="app-subtitle">
          A precision index of quantitative finance tools, libraries &amp; resources
        </p>
        <div className="header-meta">
          <a
            href="https://github.com/TradeInsight-Info/awesome-quant-tools-in-table"
            className="meta-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      {loading && (
        <div className="loading-state">
          <div className="loading-bar" />
          <span>Loading instruments…</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <span className="error-code">ERR</span>
          {error}
        </div>
      )}

      {!loading && !error && (
        <main>
          <div className="filter-bar">
            <Filters
              languages={languages}
              selectedLanguages={selectedLanguages}
              sections={sections}
              selectedSections={selectedSections}
              search={search}
              onSearchChange={setSearch}
              onLanguagesChange={setSelectedLanguages}
              onSectionsChange={setSelectedSections}
            />
          </div>
          <ToolsTable
            data={projects}
            search={search}
            selectedLanguages={selectedLanguages}
            selectedSections={selectedSections}
          />
          <footer className="app-footer">
            <span>{projects.length} tools indexed</span>
            <span className="footer-dot">·</span>
            <span>updated weekly</span>
          </footer>
        </main>
      )}
    </div>
  )
}
