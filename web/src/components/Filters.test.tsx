import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Filters } from './Filters'

const languages = ['Python', 'R']
const categories = ['Data', 'Numerical', 'Statistics']

describe('Filters', () => {
  it('renders search input and language button', () => {
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        categories={categories}
        selectedCategories={[]}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onCategoriesChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', async () => {
    const onSearch = vi.fn()
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        categories={categories}
        selectedCategories={[]}
        search=""
        onSearchChange={onSearch}
        onLanguagesChange={vi.fn()}
        onCategoriesChange={vi.fn()}
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
        categories={categories}
        selectedCategories={[]}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onCategoriesChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })

  it('shows selected category count in button label', () => {
    render(
      <Filters
        languages={languages}
        selectedLanguages={[]}
        categories={categories}
        selectedCategories={['Data']}
        search=""
        onSearchChange={vi.fn()}
        onLanguagesChange={vi.fn()}
        onCategoriesChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })
})
