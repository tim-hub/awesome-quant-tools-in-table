import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type FilterFn,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Project } from '../types'

const columnHelper = createColumnHelper<Project>()

function formatStars(stars: number | null): string {
  if (stars === null || stars === undefined) return ''
  if (stars >= 1000) return `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(stars)
}

interface ToolsTableProps {
  data: Project[]
  search: string
  selectedLanguages: string[]
  selectedCategories: string[]
}

const globalFilterFn: FilterFn<Project> = (row, _columnId, filterValue: string) => {
  const q = filterValue.toLowerCase()
  return (
    row.original.project.toLowerCase().includes(q) ||
    row.original.description.toLowerCase().includes(q)
  )
}

// Language → badge color mapping
const LANG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Python':     { bg: 'rgba(59,130,246,0.1)',  text: '#1D4ED8', border: 'transparent' },
  'R':          { bg: 'rgba(34,197,94,0.1)',   text: '#15803D', border: 'transparent' },
  'Julia':      { bg: 'rgba(168,85,247,0.1)',  text: '#7C3AED', border: 'transparent' },
  'CPP':        { bg: 'rgba(245,158,11,0.1)',  text: '#B45309', border: 'transparent' },
  'Csharp':     { bg: 'rgba(245,158,11,0.1)',  text: '#B45309', border: 'transparent' },
  'CSharp':     { bg: 'rgba(245,158,11,0.1)',  text: '#B45309', border: 'transparent' },
  'Javascript': { bg: 'rgba(234,179,8,0.12)',  text: '#854D0E', border: 'transparent' },
  'JavaScript': { bg: 'rgba(234,179,8,0.12)',  text: '#854D0E', border: 'transparent' },
  'Haskell':    { bg: 'rgba(99,102,241,0.1)',  text: '#4338CA', border: 'transparent' },
  'Elixir/Erlang': { bg: 'rgba(139,92,246,0.1)', text: '#6D28D9', border: 'transparent' },
  'Java':       { bg: 'rgba(239,68,68,0.1)',   text: '#B91C1C', border: 'transparent' },
  'Matlab':     { bg: 'rgba(232,121,249,0.1)', text: '#7E22CE', border: 'transparent' },
  'Golang':     { bg: 'rgba(6,182,212,0.1)',   text: '#0E7490', border: 'transparent' },
  'Rust':       { bg: 'rgba(249,115,22,0.1)',  text: '#C2410C', border: 'transparent' },
  'Scala':      { bg: 'rgba(244,63,94,0.1)',   text: '#BE123C', border: 'transparent' },
  'Ruby':       { bg: 'rgba(239,68,68,0.1)',   text: '#991B1B', border: 'transparent' },
}

function getLangStyle(language: string) {
  return LANG_COLORS[language] ?? { bg: 'rgba(100,100,120,0.08)', text: '#6B7280', border: 'transparent' }
}

// GitHub SVG icon (inline, no external dep)
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export function ToolsTable({ data, search, selectedLanguages, selectedCategories }: ToolsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'project', desc: false }])

  const filtered = useMemo(() => {
    let result = data
    if (selectedLanguages.length > 0) {
      result = result.filter(p => selectedLanguages.includes(p.language))
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category))
    }
    return result
  }, [data, selectedLanguages, selectedCategories])

  const columns = useMemo(() => [
    columnHelper.accessor('project', {
      header: ({ column }) => (
        <button
          className={`th-sort-btn${column.getIsSorted() ? ' is-sorted' : ''}`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label="Name"
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown />
          ) : (
            <ArrowUpDown />
          )}
        </button>
      ),
      cell: info => (
        <a
          href={info.row.original.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {info.getValue()}
        </a>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Language / Category',
      cell: info => {
        const category = info.getValue()
        const language = info.row.original.language
        const style = getLangStyle(language)
        return (
          <div className="cell-section">
            {language && (
              <span
                className="section-lang"
                style={{ background: style.bg, color: style.text, borderColor: style.border }}
              >
                {language}
              </span>
            )}
            {category && <span className="section-sub" title={category}>{category}</span>}
          </div>
        )
      },
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => (
        <span className="cell-description" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('github', {
      header: 'GitHub',
      enableSorting: false,
      cell: info => {
        const url = info.getValue()
        return url ? (
          <div className="cell-github">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="github-link"
            >
              <GithubIcon />
            </a>
          </div>
        ) : null
      },
    }),
    columnHelper.accessor(row => row.stars ?? undefined, {
      id: 'stars',
      header: ({ column }) => (
        <button
          className={`th-sort-btn${column.getIsSorted() ? ' is-sorted' : ''}`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label="Stars"
        >
          Stars
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown />
          ) : (
            <ArrowUpDown />
          )}
        </button>
      ),
      sortUndefined: 'last',
      cell: info => {
        const val = info.getValue()
        return (
          <span className={`cell-commit${val != null ? ' has-date' : ''}`}>
            {val != null ? formatStars(val) : ''}
          </span>
        )
      },
    }),
    columnHelper.accessor(row => row.last_commit ?? undefined, {
      id: 'last_commit',
      header: ({ column }) => (
        <button
          className={`th-sort-btn${column.getIsSorted() ? ' is-sorted' : ''}`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label="Last Commit"
        >
          Last Commit
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown />
          ) : (
            <ArrowUpDown />
          )}
        </button>
      ),
      sortUndefined: 'last',
      cell: info => {
        const val = info.getValue()
        return (
          <span className={`cell-commit${val ? ' has-date' : ''}`}>
            {val ?? ''}
          </span>
        )
      },
    }),
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
  })

  // Column widths — applied via th style, description gets remaining space automatically
  const colWidths: Record<string, string | undefined> = {
    project:     '160px',
    category:    '190px',
    description: undefined,   // auto — fills remaining space
    github:      '80px',
    stars:       '80px',
    last_commit: '108px',
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  style={colWidths[header.column.id] ? { width: colWidths[header.column.id] } : undefined}
                >
                  {header.isPlaceholder ? null : (
                    typeof header.column.columnDef.header === 'function'
                      ? flexRender(header.column.columnDef.header, header.getContext())
                      : <span className="th-label">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} data-col={cell.column.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                No results
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
