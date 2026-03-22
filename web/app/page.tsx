import { loadProjects } from '../src/lib/load-projects'
import { ProjectsView } from '../src/components/ProjectsView'

export default function HomePage() {
  const projects = loadProjects()
  return <ProjectsView projects={projects} />
}
