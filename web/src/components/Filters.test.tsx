import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Filters } from './Filters'

const sections = ['Python', 'R']
const subsections = ['Data', 'Numerical', 'Statistics']

describe('Filters', () => {
  it('renders search input and section button', () => {
    render(
      <Filters
        sections={sections}
        selectedSections={[]}
        subsections={subsections}
        selectedSubsections={[]}
        search=""
        onSearchChange={vi.fn()}
        onSectionsChange={vi.fn()}
        onSubsectionsChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /section/i })).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', async () => {
    const onSearch = vi.fn()
    render(
      <Filters
        sections={sections}
        selectedSections={[]}
        subsections={subsections}
        selectedSubsections={[]}
        search=""
        onSearchChange={onSearch}
        onSectionsChange={vi.fn()}
        onSubsectionsChange={vi.fn()}
      />
    )
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'arc')
    // userEvent.type fires onChange once per character; 'arc' = 3 calls
    expect(onSearch).toHaveBeenCalledTimes(3)
    expect(onSearch).toHaveBeenLastCalledWith('c')
  })

  it('shows selected section count in button label', () => {
    render(
      <Filters
        sections={sections}
        selectedSections={['Python']}
        subsections={subsections}
        selectedSubsections={[]}
        search=""
        onSearchChange={vi.fn()}
        onSectionsChange={vi.fn()}
        onSubsectionsChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })

  it('shows selected subsection count in button label', () => {
    render(
      <Filters
        sections={sections}
        selectedSections={[]}
        subsections={subsections}
        selectedSubsections={['Data']}
        search=""
        onSearchChange={vi.fn()}
        onSectionsChange={vi.fn()}
        onSubsectionsChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })
})
