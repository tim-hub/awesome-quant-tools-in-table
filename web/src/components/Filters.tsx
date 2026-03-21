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
  sections: string[]
  selectedSections: string[]
  search: string
  onSearchChange: (value: string) => void
  onLanguagesChange: (langs: string[]) => void
  onSectionsChange: (sections: string[]) => void
}

export function Filters({
  languages,
  selectedLanguages,
  sections,
  selectedSections,
  search,
  onSearchChange,
  onLanguagesChange,
  onSectionsChange,
}: FiltersProps) {
  const [langOpen, setLangOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)

  function toggleLanguage(lang: string) {
    if (selectedLanguages.includes(lang)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== lang))
    } else {
      onLanguagesChange([...selectedLanguages, lang])
    }
  }

  function toggleSection(section: string) {
    if (selectedSections.includes(section)) {
      onSectionsChange(selectedSections.filter(s => s !== section))
    } else {
      onSectionsChange([...selectedSections, section])
    }
  }

  const langLabel = selectedLanguages.length === 0
    ? 'Language'
    : `${selectedLanguages.length} selected`

  const sectionLabel = selectedSections.length === 0
    ? 'Section'
    : `${selectedSections.length} selected`

  const hasAnySelection = selectedLanguages.length > 0 || selectedSections.length > 0

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
          aria-label={langLabel}
        >
          {langLabel}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter languages..." />
            <CommandList style={{ maxHeight: '320px' }}>
              <CommandEmpty>No languages found.</CommandEmpty>
              <CommandGroup>
                {languages.map(lang => (
                  <CommandItem
                    key={lang}
                    onSelect={() => toggleLanguage(lang)}
                  >
                    <Check
                      style={{
                        marginRight: '8px',
                        width: '12px',
                        height: '12px',
                        opacity: selectedLanguages.includes(lang) ? 1 : 0,
                        color: 'var(--text-gold)',
                        flexShrink: 0,
                      }}
                    />
                    {lang}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
        <PopoverTrigger
          className={cn('section-trigger', selectedSections.length > 0 && 'has-selection')}
          aria-label={sectionLabel}
        >
          {sectionLabel}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter sections..." />
            <CommandList style={{ maxHeight: '320px' }}>
              <CommandEmpty>No sections found.</CommandEmpty>
              <CommandGroup>
                {sections.map(section => (
                  <CommandItem
                    key={section}
                    onSelect={() => toggleSection(section)}
                  >
                    <Check
                      style={{
                        marginRight: '8px',
                        width: '12px',
                        height: '12px',
                        opacity: selectedSections.includes(section) ? 1 : 0,
                        color: 'var(--text-gold)',
                        flexShrink: 0,
                      }}
                    />
                    {section}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasAnySelection && (
        <button
          onClick={() => { onLanguagesChange([]); onSectionsChange([]) }}
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
