import { describe, it, expect } from 'vitest'
import type { Project } from './types'

describe('Project type', () => {
  it('accepts a valid project with null last_commit', () => {
    const p: Project = {
      project: 'numpy',
      language: 'Python',
      section: 'Numerical',
      url: 'https://numpy.org',
      description: 'Numeric computing',
      github: false,
      cran: false,
      last_commit: null,
    }
    expect(p.last_commit).toBeNull()
    expect(p.github).toBe(false)
  })

  it('accepts a project with a last_commit date', () => {
    const p: Project = {
      project: 'ArcticDB',
      language: 'Python',
      section: 'Data',
      url: 'https://github.com/man-group/ArcticDB',
      description: 'High perf datastore',
      github: true,
      cran: false,
      last_commit: '2025-12-30',
    }
    expect(p.last_commit).toBe('2025-12-30')
    expect(p.github).toBe(true)
  })
})
