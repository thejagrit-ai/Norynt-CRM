'use client';
// app/(dashboard)/data/page.tsx — Data Hub: CSV export, bulk CSV batch intake, and error diagnostic logs.
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, UploadCloud, Database, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { Badge } from '@/components/atoms/Badge';

interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export default function DataPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const [entity, setEntity] = useState<'contacts' | 'companies'>('contacts');
  const [csv, setCsv] = useState('');

  async function exportCsv(which: 'contacts' | 'companies' | 'deals') {
    const res = await api.get(`/data/export/${which}`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${which}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const importMut = useMutation({
    mutationFn: async () =>
      unwrap<ImportResult>(
        (await api.post(`/data/import/${entity}`, { csv })).data,
      ),
  });

  return (
    <DashboardTemplate title="page.data">
      <div className="space-y-6">
        {can('data.export') && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('data.exportTitle')}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Export all your system records instantly in UTF-8 compatible CSV format
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportCsv('contacts')}
                className="py-2 px-4 text-xs font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{t('data.entityContacts')}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportCsv('companies')}
                className="py-2 px-4 text-xs font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{t('data.entityCompanies')}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportCsv('deals')}
                className="py-2 px-4 text-xs font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{t('data.entityDeals')}</span>
              </Button>
            </div>
          </Card>
        )}

        {can('data.import') && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="h-4 w-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('data.importTitle')}
              </h3>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select
                value={entity}
                onChange={(e) =>
                  setEntity(e.target.value as 'contacts' | 'companies')
                }
                className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500"
              >
                <option value="contacts" className="bg-slate-900">{t('data.entityContacts')}</option>
                <option value="companies" className="bg-slate-900">{t('data.entityCompanies')}</option>
              </select>
              <span className="text-xs text-slate-400 font-mono">
                {entity === 'contacts'
                  ? t('data.headerContacts')
                  : t('data.headerCompanies')}
              </span>
            </div>
            <Textarea
              rows={6}
              placeholder={t('data.placeholder')}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              className="mb-4 font-mono text-xs"
            />
            <Button
              onClick={() => importMut.mutate()}
              disabled={importMut.isPending || csv.trim().length === 0}
              loading={importMut.isPending}
            >
              <UploadCloud className="h-4 w-4" />
              <span>{t('data.importBtn')}</span>
            </Button>

            {importMut.data && (
              <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs">
                <div className="flex items-center gap-2 mb-2 font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    {t('data.created')}: {importMut.data.created} ·{' '}
                    {t('data.skipped')}: {importMut.data.skipped} ·{' '}
                    {t('data.errors')}: {importMut.data.errors.length}
                  </span>
                </div>
                {importMut.data.errors.length > 0 && (
                  <ul className="space-y-1 pl-5 text-xs text-rose-400 list-disc border-t border-slate-800 pt-2 mt-2">
                    {importMut.data.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {importMut.isError && (
              <p className="mt-3 text-xs font-medium text-rose-400">{t('data.importError')}</p>
            )}
          </Card>
        )}
      </div>
    </DashboardTemplate>
  );
}
