import { useState, useEffect, useMemo } from 'react'
import { Filters } from './components/Filters'
import { ToolsTable } from './components/ToolsTable'
import type { Project } from './types'

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/awesome-quant-tools-in-table/projects.json')
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

  const sections = useMemo(
    () => [...new Set(projects.map(p => p.section))].sort(),
    [projects]
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Awesome Quant Tools</h1>
      <p className="text-muted-foreground mb-6">
        A curated list of quantitative finance tools. Source:{' '}
        <a
          href="https://github.com/hbai/awesome-quant-tools-in-table"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-4">
            <Filters
              sections={sections}
              selectedSections={selectedSections}
              search={search}
              onSearchChange={setSearch}
              onSectionsChange={setSelectedSections}
            />
          </div>
          <ToolsTable
            data={projects}
            search={search}
            selectedSections={selectedSections}
          />
          <p className="text-sm text-muted-foreground mt-4">
            {projects.length} tools total
          </p>
        </>
      )}
    </div>
  )
}
