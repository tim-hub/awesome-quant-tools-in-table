import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FiltersProps {
  languages: string[]
  selectedLanguages: string[]
  categories: string[]
  selectedCategories: string[]
  search: string
  onSearchChange: (value: string) => void
  onLanguagesChange: (languages: string[]) => void
  onCategoriesChange: (categories: string[]) => void
}

export function Filters({
  languages,
  selectedLanguages,
  categories,
  selectedCategories,
  search,
  onSearchChange,
  onLanguagesChange,
  onCategoriesChange,
}: FiltersProps) {
  const [langOpen, setLangOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)

  function toggleSection(language: string) {
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter(s => s !== language))
    } else {
      onLanguagesChange([...selectedLanguages, language])
    }
  }

  function toggleSubsection(category: string) {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(s => s !== category))
    } else {
      onCategoriesChange([...selectedCategories, category])
    }
  }

  const sectionLabel = selectedLanguages.length === 0
    ? 'Language'
    : `${selectedLanguages.length} selected`

  const subsectionLabel = selectedCategories.length === 0
    ? 'Category'
    : `${selectedCategories.length} selected`

  const hasAnySelection = selectedLanguages.length > 0 || selectedCategories.length > 0

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Input
        placeholder="Search instruments..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="search-input"
      />

      <Popover open={langOpen} onOpenChange={setLangOpen}>
        <PopoverTrigger
          className={cn('section-trigger', selectedLanguages.length > 0 && 'has-selection')}
          aria-label={sectionLabel}
        >
          {sectionLabel}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter languages..." />
            <CommandList style={{ maxHeight: '320px' }}>
              <CommandEmpty>No languages found.</CommandEmpty>
              <CommandGroup>
                {languages.map(language => (
                  <CommandItem
                    key={language}
                    onSelect={() => toggleSection(language)}
                  >
                    <Check
                      style={{
                        marginRight: '8px',
                        width: '12px',
                        height: '12px',
                        opacity: selectedLanguages.includes(language) ? 1 : 0,
                        color: 'var(--text-gold)',
                        flexShrink: 0,
                      }}
                    />
                    {language}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
        <PopoverTrigger
          className={cn('section-trigger', selectedCategories.length > 0 && 'has-selection')}
          aria-label={subsectionLabel}
        >
          {subsectionLabel}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter categories..." />
            <CommandList style={{ maxHeight: '320px' }}>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {categories.map(category => (
                  <CommandItem
                    key={category}
                    onSelect={() => toggleSubsection(category)}
                  >
                    <Check
                      style={{
                        marginRight: '8px',
                        width: '12px',
                        height: '12px',
                        opacity: selectedCategories.includes(category) ? 1 : 0,
                        color: 'var(--text-gold)',
                        flexShrink: 0,
                      }}
                    />
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasAnySelection && (
        <button
          onClick={() => { onLanguagesChange([]); onCategoriesChange([]) }}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0 4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Clear
        </button>
      )}
    </div>
  )
}
