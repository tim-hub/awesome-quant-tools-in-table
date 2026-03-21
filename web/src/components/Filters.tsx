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
  search: string
  onSearchChange: (value: string) => void
  onSectionsChange: (sections: string[]) => void
}

export function Filters({
  sections,
  selectedSections,
  search,
  onSearchChange,
  onSectionsChange,
}: FiltersProps) {
  const [open, setOpen] = useState(false)

  function toggleSection(section: string) {
    if (selectedSections.includes(section)) {
      onSectionsChange(selectedSections.filter(s => s !== section))
    } else {
      onSectionsChange([...selectedSections, section])
    }
  }

  const label = selectedSections.length === 0
    ? 'Language'
    : `${selectedSections.length} selected`

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Input
        placeholder="Search instruments..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="search-input"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn('section-trigger', selectedSections.length > 0 && 'has-selection')}
          aria-label={label}
        >
          {label}
          <ChevronDown />
        </PopoverTrigger>
        <PopoverContent className="section-popover" style={{ width: '320px', padding: 0 }} align="start">
          <Command>
            <CommandInput placeholder="Filter languages..." />
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

      {selectedSections.length > 0 && (
        <button
          onClick={() => onSectionsChange([])}
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
