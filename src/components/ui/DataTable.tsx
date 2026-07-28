import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchKeys?: string[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, rowKey, searchKeys, searchPlaceholder, emptyTitle = 'No data', emptyDescription, onRowClick }: DataTableProps<T>) {
  return (
    <div>
      {searchKeys && searchKeys.length > 0 && (
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder={searchPlaceholder ?? 'Search…'} onChange={() => {}} />
        </div>
      )}
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-ink-muted">
                {columns.map((c) => <th key={c.key} className="py-2 pr-4 font-medium">{c.header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {data.map((row) => (
                <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}>
                  {columns.map((c) => <td key={c.key} className="py-2.5 pr-4 text-ink-soft dark:text-slate-300">{c.render ? c.render(row) : (row as any)[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
