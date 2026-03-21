import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Filters } from './Filters'

const languages = ['Python', 'R']
const sections = ['Data', 'Numerical', 'Statistics']

describe('Filters', () => {
  it('renders search input and section button', () => {
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        sections={sections}
        selectedSections={[]}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /section/i })).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', async () => {
    const onSearch = vi.fn()
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        sections={sections}
        selectedSections={[]}
        search=""
        onSearchChange={onSearch}
        onLanguagesChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'arc')
    // userEvent.type fires onChange once per character; 'arc' = 3 calls
    expect(onSearch).toHaveBeenCalledTimes(3)
    expect(onSearch).toHaveBeenLastCalledWith('c')
  })

  it('shows selected language count in button label', () => {
    render(
      <Filters
        languages={languages}
        selectedLanguages={['Python']}
        sections={sections}
        selectedSections={[]}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })

  it('shows selected section count in button label', () => {
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        sections={sections}
        selectedSections={['Data']}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })
})
