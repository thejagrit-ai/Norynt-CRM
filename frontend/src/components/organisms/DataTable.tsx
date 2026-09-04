'use client';
// src/components/organisms/DataTable.tsx — enterprise-grade CRM table with empty state, auto-i18n headers & row hover highlights.
import React from 'react';
import { Card } from '../atoms/Card';
import { Inbox } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = 'No records found',
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  const { t } = useI18n();

  const formatHeader = (h: string) => {
    if (!h) return '';
    // If it's a translation key like col.name or COL.NAME
    const translated = t(h);
    if (translated !== h && !translated.startsWith('col.') && !translated.startsWith('COL.')) {
      return translated;
    }
    // Clean up col. or COL. prefixes if not found in dict
    if (h.toLowerCase().startsWith('col.')) {
      const clean = h.slice(4);
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return h;
  };

  return (
    <Card className="overflow-hidden border-slate-200/90 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/70 dark:text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-5 py-3.5 whitespace-nowrap">
                  {formatHeader(c.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 shadow-xs dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                        {empty}
                      </p>
                      <p className="text-xs text-slate-500">
                        No matching entries found.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`group transition-colors duration-150 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                      : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400">
          <span className="font-medium">
            Total <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">{rows.length}</span> records
          </span>
        </div>
      )}
    </Card>
  );
}
