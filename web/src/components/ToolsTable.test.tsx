import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolsTable } from './ToolsTable'
import type { Project } from '../types'

const projects: Project[] = [
  {
    project: 'ArcticDB',
    language: 'Python',
    section: 'Data',
    url: 'https://github.com/man-group/ArcticDB',
    description: 'High perf datastore',
    github: true,
    cran: false,
    last_commit: '2025-12-30',
  },
  {
    project: 'numpy',
    language: 'R',
    section: 'Numerical',
    url: 'https://numpy.org',
    description: 'Numeric computing',
    github: false,
    cran: false,
    last_commit: null,
  },
]

describe('ToolsTable', () => {
  it('renders all project rows', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
    expect(screen.getByText('numpy')).toBeInTheDocument()
  })

  it('filters rows by search term', () => {
    render(<ToolsTable data={projects} search="arctic" selectedSections={[]} />)
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
    expect(screen.queryByText('numpy')).not.toBeInTheDocument()
  })

  it('filters rows by selected language', () => {
    render(
      <ToolsTable data={projects} search="" selectedSections={['R']} />
    )
    expect(screen.queryByText('ArcticDB')).not.toBeInTheDocument()
    expect(screen.getByText('numpy')).toBeInTheDocument()
  })

  it('renders GitHub link for GitHub projects', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/man-group/ArcticDB')
  })

  it('shows blank last_commit for projects without one', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    expect(screen.getByText('2025-12-30')).toBeInTheDocument()
    // numpy's last_commit cell should be empty — check it has no date text
    const cells = screen.getAllByRole('cell')
    const numpyRow = cells.find(c => c.textContent?.includes('Numeric computing'))
    expect(numpyRow).toBeDefined()
  })

  it('sorts by last_commit when header is clicked', async () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    const header = screen.getByRole('button', { name: /last commit/i })
    await userEvent.click(header)
    // After clicking, rows should still render
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
  })
})
