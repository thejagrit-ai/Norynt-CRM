'use client';
// app/(dashboard)/connections/guide/page.tsx — Integration documentation manual with independent EN/TR switch.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { INTEGRATION_GUIDE, type GuideLang } from '@/lib/integration-guide';

type DocLang = 'en' | 'tr';

const UI = {
  en: {
    title: 'Integration Guide',
    intro:
      'Step-by-step setup for every integration on the Connections page. Pick a service below.',
    langNote:
      'This guide is available in English and Turkish only — independent of the app language — and always opens in English. Use the toggle above to switch; it will not affect the rest of the app.',
    prerequisites: 'Prerequisites',
    steps: 'Steps',
    fields: 'What to enter in the CRM',
    notes: 'Notes',
    openDocs: 'Official documentation ↗',
    back: '← Back to Connections',
    toc: 'Integrations',
  },
  tr: {
    title: 'Entegrasyon Rehberi',
    intro:
      'Bağlantılar sayfasındaki her entegrasyon için adım adım kurulum. Aşağıdan bir servis seçin.',
    langNote:
      'Bu rehber yalnızca İngilizce ve Türkçe olarak sunulur — uygulama dilinden bağımsızdır — ve her zaman İngilizce açılır. Yukarıdaki düğmeyle değiştirin; bu, uygulamanın geri kalanını etkilemez.',
    prerequisites: 'Ön koşullar',
    steps: 'Adımlar',
    fields: 'CRM’e girilecekler',
    notes: 'Notlar',
    openDocs: 'Resmi dokümantasyon ↗',
    back: '← Bağlantılara dön',
    toc: 'Entegrasyonlar',
  },
};

export default function IntegrationGuidePage() {
  const [lang, setLang] = useState<DocLang>('en');
  const ui = UI[lang];

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, []);

  const domain =
    typeof window !== 'undefined' ? window.location.origin : '{DOMAIN}';
  const fill = (s: string) => s.replaceAll('{DOMAIN}', domain);

  const section = (title: string, items: string[], ordered?: boolean) => {
    if (!items.length) return null;
    const List = ordered ? 'ol' : 'ul';
    return (
      <div className="mt-4 space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {title}
        </h4>
        <List
          className={`space-y-1 pl-5 text-xs text-slate-300 ${
            ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items.map((x, i) => (
            <li key={i} className="leading-relaxed">{fill(x)}</li>
          ))}
        </List>
      </div>
    );
  };

  return (
    <DashboardTemplate
      title={ui.title}
      headerAction={
        <div className="flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1">
            {(['en', 'tr'] as DocLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  lang === l
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l === 'en' ? 'English' : 'Türkçe'}
              </button>
            ))}
          </div>
          <Link
            href="/connections"
            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{ui.back}</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-400">{ui.intro}</p>

        {/* Table of contents quick jumps */}
        <Card className="p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {ui.toc}
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEGRATION_GUIDE.map((g) => (
              <a
                key={g.key}
                href={`#${g.key}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 hover:border-brand-500 hover:text-white transition"
              >
                <span aria-hidden>{g.icon}</span>
                <span className="font-semibold">{g.name}</span>
              </a>
            ))}
          </div>
        </Card>

        {/* Integration Manuals */}
        <div className="space-y-6">
          {INTEGRATION_GUIDE.map((g) => {
            const c: GuideLang = g[lang];
            return (
              <div key={g.key} id={g.key} className="scroll-mt-20">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                    <span className="text-2xl" aria-hidden>
                      {g.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {g.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{fill(c.summary)}</p>
                    </div>
                  </div>

                  {section(ui.prerequisites, c.prerequisites)}
                  {section(ui.steps, c.steps, true)}

                  {c.fields.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {ui.fields}
                      </h4>
                      <div className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
                        {c.fields.map((f, i) => (
                          <div key={i} className="flex flex-wrap items-baseline gap-2">
                            <span className="font-semibold text-brand-300">
                              {f.label}:
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">{fill(f.hint)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section(ui.notes, c.notes)}

                  <div className="pt-3 border-t border-slate-800/80">
                    <a
                      href={c.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      <span>{ui.openDocs}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardTemplate>
  );
}
