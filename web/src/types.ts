export interface Project {
  project: string
  language: string    // e.g. "Python", "R" — empty string if not applicable
  category: string    // e.g. "Backtesting", "Data Analysis" — empty string if not applicable
  url: string
  description: string
  github: string | null
  last_commit: string | null
  stars: number | null
}
