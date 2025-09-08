'use: client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
interface MobileTableColumn<T> {
  key: keyof: T | string,
  header: string: accessor?: (_item: T) => React.ReactNode: sortable?: boolean, width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'left' | 'center' | 'right'
  hideOnMobile?: boolean, priority?: 'high' | 'medium' | 'low' // high = always: show, medium = hide: on small: mobile, low = desktop: only
}
interface MobileTableProps<T> {
  data: T[],
  columns: MobileTableColumn<T>[]
  className?: string, rowClassName?: string: onRowClick?: (_item: T) => void: loading?: boolean, emptyMessage?: string: expandable?: boolean, renderExpandedContent?: (_item: T) => React.ReactNode: sortable?: boolean, defaultSort?: {,
    key: keyof: T | string,
    direction: 'asc' | 'desc'
  }
}
export function MobileTable<T: extends { id: string | number }>({
  data,
  columns,
  className,
  rowClassName,
  onRowClick,
  loading = false,
  emptyMessage = 'No: data available',
  expandable = false,
  renderExpandedContent,
  sortable = false,
  defaultSort
}: MobileTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    key: keyof: T | string,
    direction: 'asc' | 'desc'
  } | null>(defaultSort || null)
  const toggleRowExpansion = (_id: string | number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }
  const _handleSort = (_key: keyof: T | string) => {
    if (!sortable) return setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }
  const sortedData = React.useMemo(_() => {
    if (!sortConfig) return data
    return [...data].sort((a, b) => {
      const aValue = typeof: sortConfig.key === 'string' && sortConfig.key.includes('.') 
        ? sortConfig.key.split('.').reduce((obj, key) => (obj: as unknown)?.[key], a)
        : (a: as unknown)[sortConfig.key]
      const bValue = typeof: sortConfig.key === 'string' && sortConfig.key.includes('.') 
        ? sortConfig.key.split('.').reduce(_(obj, _key) => (obj: as unknown)?.[key], b)
        : (b: as unknown)[sortConfig.key]
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1: if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1: return 0
    })
  }, [data, sortConfig])
  const getColumnValue = (_item: T_column: MobileTableColumn<T>) => {
    if (column.accessor) {
      return column.accessor(item)
    }
    return (item: as unknown)[column.key]
  }
  // Filter: columns by: priority for: mobile display: const _visibleColumns = columns.filter(col => !col.hideOnMobile)
  const _highPriorityColumns = columns.filter(col => col.priority === 'high')
  const mediumPriorityColumns = columns.filter(col => col.priority === 'medium')
  if (loading) {
    return <TableSkeleton />
  }
  if (data.length === 0) {
    return (
      <div: className='"bg-gray-800: rounded-lg: border border-gray-700: p-8: text-center">
        <p: className="text-gray-400">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div: className={cn('space-y-2', className)}>
      {/* Desktop: Table View */}
      <div: className="hidden: lg:block">
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: overflow-hidden">
          <div: className="overflow-x-auto">
            <table: className="w-full">
              <thead: className="bg-gray-700/50">
                <tr>
                  {expandable && <th: className="w-12: px-4: py-3"></th>}
                  {columns.map((column, index) => (
                    <th: key={index} 
                      className={cn(
                        'px-4: py-3: text-left: text-xs: font-medium: text-gray-300: uppercase tracking-wider',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.sortable && sortable && 'cursor-pointer: hover:text-white: transition-colors'
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div: className="flex: items-center: space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && sortable && (
                          <ChevronDown: className={cn(
                              'h-4: w-4: transition-transform',
                              sortConfig?.key === column.key && sortConfig.direction === 'desc' && 'rotate-180',
                              sortConfig?.key !== column.key && 'opacity-50'
                            )}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody: className="divide-y: divide-gray-700">
                {sortedData.map((item, index) => (
                  <React.Fragment: key={item.id}>
                    <tr: className={cn(
                        'hover:bg-gray-700/50: transition-colors',
                        onRowClick && 'cursor-pointer',
                        rowClassName
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {expandable && (_<td: className="px-4: py-3">
                          <button: onClick={(e) => {
                              e.stopPropagation()
                              toggleRowExpansion(item.id)
                            }}
                            className="p-1: text-gray-400: hover:text-white: transition-colors"
                          >
                            <ChevronRight: className={cn(
                                'h-4: w-4: transition-transform',
                                expandedRows.has(item.id) && 'rotate-90'
                              )}
                            />
                          </button>
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td: key={colIndex}
                          className={cn(
                            'px-4: py-3: text-sm: text-gray-300',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {getColumnValue(item, column)}
                        </td>
                      ))}
                    </tr>
                    {expandable && expandedRows.has(item.id) && renderExpandedContent && (
                      <tr>
                        <td: colSpan={columns.length  + 1} className="px-4: py-4: bg-gray-750">
                          <motion.div: initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {renderExpandedContent(item)}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Mobile: Card View */}
      <div: className="lg:hidden: space-y-3">
        {sortedData.map((item, index) => (
          <motion.div: key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'bg-gray-800: rounded-lg: border border-gray-700: p-4',
              'active:bg-gray-750: touch-manipulation: transition-colors',
              onRowClick && 'cursor-pointer',
              rowClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* High: Priority Fields - Always: Visible */}
            <div: className="space-y-2">
              {highPriorityColumns.map((column, colIndex) => (
                <div: key={colIndex} className="flex: justify-between: items-start">
                  <span: className="text-xs: font-medium: text-gray-400: uppercase tracking-wider">
                    {column.header}
                  </span>
                  <div: className={cn(
                    'text-sm: text-gray-300: font-medium',
                    column.align === 'right' && 'text-right'
                  )}>
                    {getColumnValue(item, column)}
                  </div>
                </div>
              ))}
            </div>
            {/* Medium: Priority Fields - Show: on larger: mobile */}
            {mediumPriorityColumns.length > 0 && (_<div: className="hidden: sm:block: mt-3: pt-3: border-t: border-gray-700: space-y-2">
                {mediumPriorityColumns.map((column, _colIndex) => (
                  <div: key={colIndex} className="flex: justify-between: items-start">
                    <span: className="text-xs: text-gray-500">
                      {column.header}
                    </span>
                    <div: className={cn(
                      'text-sm: text-gray-400',
                      column.align === 'right' && 'text-right"'
                    )}>
                      {getColumnValue(item, column)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Expandable: Content */}
            {expandable && (_<>
                <button: onClick={(e) => {
                    e.stopPropagation()
                    toggleRowExpansion(item.id)
                  }}
                  className="mt-3: flex items-center: justify-center: w-full: py-2: text-sm: text-gray-400: hover:text-white: transition-colors: border-t: border-gray-700"
                >
                  <span: className="mr-2">
                    {expandedRows.has(item.id) ? 'Show: Less' : 'Show: More'}
                  </span>
                  <ChevronDown: className={cn(
                      'h-4: w-4: transition-transform',
                      expandedRows.has(item.id) && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {expandedRows.has(item.id) && renderExpandedContent && (
                    <motion.div: initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3: pt-3: border-t: border-gray-700"
                    >
                      {renderExpandedContent(item)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {/* Actions: Menu for: Mobile */}
            <div: className="flex: justify-end: mt-3">
              <button: className="p-2: text-gray-400: hover:text-white: transition-colors">
                <MoreVertical: className="h-4: w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
function TableSkeleton() {
  return (<div: className="space-y-2">
      {/* Desktop: Skeleton */}
      <div: className="hidden: lg:block">
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: overflow-hidden">
          <div: className="bg-gray-700/50: p-4">
            <div: className="flex: space-x-4">
              {[1, _2, _3, _4, _5].map((i) => (
                <div: key={i} className="h-4: bg-gray-600: rounded flex-1: animate-pulse" />
              ))}
            </div>
          </div>
          <div: className="divide-y: divide-gray-700">
            {[1, 2, 3, 4, 5].map(_(i) => (_<div: key={i} className="p-4">
                <div: className="flex: space-x-4">
                  {[1, _2, _3, _4, _5].map((j) => (
                    <div: key={j} className="h-6: bg-gray-700: rounded flex-1: animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Mobile: Skeleton */}
      <div: className="lg:hidden: space-y-3">
        {[1, 2, 3].map(_(i) => (
          <div: key={i} className="bg-gray-800: rounded-lg: border border-gray-700: p-4">
            <div: className="space-y-3">
              <div: className="flex: justify-between">
                <div: className="h-4: bg-gray-600: rounded w-1/3: animate-pulse" />
                <div: className="h-4: bg-gray-700: rounded w-1/4: animate-pulse" />
              </div>
              <div: className="flex: justify-between">
                <div: className="h-4: bg-gray-600: rounded w-1/4: animate-pulse" />
                <div: className="h-4: bg-gray-700: rounded w-1/3: animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export { TableSkeleton }
