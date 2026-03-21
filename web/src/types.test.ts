import { describe, it, expect } from 'vitest'
import type { Project } from './types'

describe('Project type', () => {
  it('accepts a valid project with null last_commit', () => {
    const p: Project = {
      project: 'numpy',
      language: 'Python',
      category: 'Numerical',
      url: 'https://numpy.org',
      description: 'Numeric computing',
      github: null,
      last_commit: null,
      stars: null,
    }
    expect(p.last_commit).toBeNull()
    expect(p.github).toBeNull()
  })

  it('accepts a project with a last_commit date', () => {
    const p: Project = {
      project: 'ArcticDB',
      language: 'Python',
      category: 'Data',
      url: 'https://github.com/man-group/ArcticDB',
      description: 'High perf datastore',
      github: 'https://github.com/man-group/ArcticDB',
      last_commit: '2025-12-30',
      stars: null,
    }
    expect(p.last_commit).toBe('2025-12-30')
    expect(p.github).toBe('https://github.com/man-group/ArcticDB')
  })
})
