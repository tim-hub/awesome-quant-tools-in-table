import { readFileSync } from 'fs'
import { join } from 'path'
import type { Project } from '../types'

export function loadProjects(): Project[] {
  const filePath = join(process.cwd(), 'public', 'projects.json')
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as Project[]
}
