import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
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
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: '#1e2d45', color: '#5c7a9a' }}>
                {columns.map((c) => <th key={c.key} className="py-2 pr-4 font-medium">{c.header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(30,45,69,0.5)' }}>
              {data.map((row) => (
                <tr key={rowKey(row)} onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer transition-colors' : ''}
                  style={onRowClick ? { color: '#a0b3c6' } : { color: '#a0b3c6' }}
                  onMouseEnter={(e) => onRowClick ? (e.currentTarget.style.background = '#1a2236') : {}}
                  onMouseLeave={(e) => onRowClick ? (e.currentTarget.style.background = '') : {}}>
                  {columns.map((c) => <td key={c.key} className="py-2.5 pr-4">{c.render ? c.render(row) : (row as any)[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
