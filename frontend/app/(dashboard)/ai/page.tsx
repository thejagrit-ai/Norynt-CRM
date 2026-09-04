'use client';
// app/(dashboard)/ai/page.tsx — AI Copilot Workbench with live model status, prompt presets, and copy triggers with full i18n.
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Mail,
  FileText,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { Badge } from '@/components/atoms/Badge';

interface EmailDraft {
  subject: string;
  body: string;
}
interface Summary {
  summary: string;
  highlights: string[];
}

export default function AiPage() {
  const { t } = useI18n();
  const status = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () =>
      unwrap<{ enabled: boolean; model: string }>(
        (await api.get('/ai/status')).data,
      ),
  });

  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [text, setText] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedSum, setCopiedSum] = useState(false);

  const draft = useMutation({
    mutationFn: async () =>
      unwrap<EmailDraft>(
        (await api.post('/ai/draft-email', { context, tone })).data,
      ),
  });

  const summary = useMutation({
    mutationFn: async () =>
      unwrap<Summary>((await api.post('/ai/summarize', { text })).data),
  });

  const copyToClipboard = (content: string, type: 'draft' | 'sum') => {
    navigator.clipboard.writeText(content);
    if (type === 'draft') {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } else {
      setCopiedSum(true);
      setTimeout(() => setCopiedSum(false), 2000);
    }
  };

  const errMsg = (e: unknown) =>
    (e as { response?: { status?: number } })?.response?.status === 503
      ? t('ai.err503')
      : t('ai.errGeneric');

  return (
    <DashboardTemplate title="page.ai">
      {/* AI Model Status Card */}
      {status.data && !status.data.enabled && (
        <Card className="border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300 backdrop-blur-sm shadow-card">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <span>{t('ai.disabledMsg')}</span>
          </div>
        </Card>
      )}

      {status.data?.enabled && (
        <Card className="border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 backdrop-blur-sm shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-semibold">{t('ai.enabledPrefix')}</span>
              <code className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-200">
                {status.data.model}
              </code>
            </div>
            <Badge tone="emerald" dot>Ready</Badge>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Email Draft Copilot */}
        <Card className="p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('ai.draftTitle')}
                </h3>
                <p className="text-xs text-slate-400">Generate high-conversion drafts based on conversation context</p>
              </div>
            </div>
          </div>

          <Textarea
            rows={4}
            placeholder={t('ai.draftPh')}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="mb-4"
          />

          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-500" />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="professional" className="bg-slate-900">{t('ai.toneProfessional')}</option>
                <option value="friendly" className="bg-slate-900">{t('ai.toneFriendly')}</option>
                <option value="formal" className="bg-slate-900">{t('ai.toneFormal')}</option>
              </select>
            </div>

            <Button
              onClick={() => draft.mutate()}
              disabled={draft.isPending || context.trim().length < 3}
              loading={draft.isPending}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('ai.draftBtn')}</span>
            </Button>
          </div>

          {draft.isError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {errMsg(draft.error)}
            </div>
          )}

          {draft.data && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-card">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-bold text-slate-300">
                  {draft.data.subject}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${draft.data?.subject}\n\n${draft.data?.body}`, 'draft')}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  {copiedDraft ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-mono">
                {draft.data.body}
              </p>
            </div>
          )}
        </Card>

        {/* Text Summarizer Copilot */}
        <Card className="p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('ai.sumTitle')}
                </h3>
                <p className="text-xs text-slate-400">Extract action items, risks, and meeting takeaways</p>
              </div>
            </div>
          </div>

          <Textarea
            rows={4}
            placeholder={t('ai.sumPh')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-4"
          />

          <div className="mb-4 flex items-center gap-3">
            <Button
              onClick={() => summary.mutate()}
              disabled={summary.isPending || text.trim().length < 3}
              loading={summary.isPending}
            >
              <Zap className="h-4 w-4" />
              <span>{t('ai.sumBtn')}</span>
            </Button>
          </div>

          {summary.isError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {errMsg(summary.error)}
            </div>
          )}

          {summary.data && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-bold text-slate-300">{t('ai.sumTitle')}</span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${summary.data?.summary}\n\nHighlights:\n${summary.data?.highlights.join('\n')}`,
                      'sum',
                    )
                  }
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  {copiedSum ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {summary.data.summary}
              </p>

              {summary.data.highlights?.length > 0 && (
                <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
                  <p className="text-xs font-semibold text-brand-300 mb-2">Key Highlights:</p>
                  <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-300">
                    {summary.data.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardTemplate>
  );
}
