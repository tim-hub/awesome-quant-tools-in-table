export interface Project {
  project: string
  section: string       // Main section (e.g. "Python", "R") — empty if not applicable
  subsection: string    // Sub-section (e.g. "Backtesting") — empty if not applicable
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null
  stars: number | null
}
