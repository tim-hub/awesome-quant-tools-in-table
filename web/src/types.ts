export interface Project {
  project: string
  section: string
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null  // 'YYYY-MM-DD' or null
}
