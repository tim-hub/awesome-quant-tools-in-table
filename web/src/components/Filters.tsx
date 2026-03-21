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
  sections: string[]
  selectedSections: string[]
  subsections: string[]
  selectedSubsections: string[]
  search: string
  onSearchChange: (value: string) => void
  onSectionsChange: (sections: string[]) => void
  onSubsectionsChange: (subsections: string[]) => void
}

export function Filters({
  sections,
  selectedSections,
  subsections,
  selectedSubsections,
  search,
  onSearchChange,
  onSectionsChange,
  onSubsectionsChange,
}: FiltersProps) {
  const [langOpen, setLangOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)

  function toggleSection(section: string) {
    if (selectedSections.includes(section)) {
      onSectionsChange(selectedSections.filter(s => s !== section))
    } else {
      onSectionsChange([...selectedSections, section])
    }
  }

  function toggleSubsection(subsection: string) {
    if (selectedSubsections.includes(subsection)) {
      onSubsectionsChange(selectedSubsections.filter(s => s !== subsection))
    } else {
      onSubsectionsChange([...selectedSubsections, subsection])
    }
  }

  const sectionLabel = selectedSections.length === 0
    ? 'Section'
    : `${selectedSections.length} selected`

  const subsectionLabel = selectedSubsections.length === 0
    ? 'Sub Section'
    : `${selectedSubsections.length} selected`

  const hasAnySelection = selectedSections.length > 0 || selectedSubsections.length > 0

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

      <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
        <PopoverTrigger
          className={cn('section-trigger', selectedSubsections.length > 0 && 'has-selection')}
          aria-label={subsectionLabel}
        >
          {subsectionLabel}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter sub sections..." />
            <CommandList style={{ maxHeight: '320px' }}>
              <CommandEmpty>No sub sections found.</CommandEmpty>
              <CommandGroup>
                {subsections.map(subsection => (
                  <CommandItem
                    key={subsection}
                    onSelect={() => toggleSubsection(subsection)}
                  >
                    <Check
                      style={{
                        marginRight: '8px',
                        width: '12px',
                        height: '12px',
                        opacity: selectedSubsections.includes(subsection) ? 1 : 0,
                        color: 'var(--text-gold)',
                        flexShrink: 0,
                      }}
                    />
                    {subsection}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasAnySelection && (
        <button
          onClick={() => { onSectionsChange([]); onSubsectionsChange([]) }}
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
