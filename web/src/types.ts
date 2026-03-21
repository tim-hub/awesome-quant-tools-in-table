export interface Project {
  project: string
  language: string      // e.g. "Python", "R" — derived from section prefix before ' > '
  section: string       // e.g. "Numerical Libraries" — the subcategory after ' > ', or full section if no ' > '
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null
}
