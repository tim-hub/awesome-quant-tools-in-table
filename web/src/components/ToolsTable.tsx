import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type FilterFn,
  type SortingFn,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project } from '../types'

const columnHelper = createColumnHelper<Project>()

interface ToolsTableProps {
  data: Project[]
  search: string
  selectedSections: string[]
}

const globalFilterFn: FilterFn<Project> = (row, _columnId, filterValue: string) => {
  const q = filterValue.toLowerCase()
  return (
    row.original.project.toLowerCase().includes(q) ||
    row.original.description.toLowerCase().includes(q)
  )
}

// null values always sort last, regardless of direction
const lastCommitSort: SortingFn<Project> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<string | null>(columnId)
  const b = rowB.getValue<string | null>(columnId)
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a < b ? -1 : a > b ? 1 : 0
}

export function ToolsTable({ data, search, selectedSections }: ToolsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const filtered = useMemo(() => {
    if (selectedSections.length === 0) return data
    return data.filter(p => selectedSections.includes(p.section))
  }, [data, selectedSections])

  const columns = useMemo(() => [
    columnHelper.accessor('project', {
      header: 'Name',
      cell: info => (
        <a
          href={info.row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline"
        >
          {info.getValue()}
        </a>
      ),
    }),
    columnHelper.accessor('section', {
      header: 'Section',
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => (
        <span className="line-clamp-2" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('github', {
      header: 'GitHub',
      enableSorting: false,
      cell: info =>
        info.getValue() ? (
          <a
            href={info.row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex"
          >
            <Github className="h-4 w-4" />
          </a>
        ) : null,
    }),
    columnHelper.accessor('last_commit', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label="Last Commit"
        >
          Last Commit
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      sortingFn: lastCommitSort,
      cell: info => info.getValue() ?? '',
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
