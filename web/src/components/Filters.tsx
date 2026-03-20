import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
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
    ? 'Section'
    : `${selectedSections.length} selected`

  return (
    <div className="flex gap-2 flex-wrap">
      <Input
        placeholder="Search by name or description..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="max-w-sm"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(buttonVariants({ variant: 'outline' }))}
          aria-label={label}
        >
          {label}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search sections..." />
            <CommandList>
              <CommandEmpty>No sections found.</CommandEmpty>
              <CommandGroup>
                {sections.map(section => (
                  <CommandItem
                    key={section}
                    onSelect={() => toggleSection(section)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedSections.includes(section) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {section}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
