'use client';
// app/(dashboard)/language/page.tsx — Worldwide Language Localization Hub with 100+ World Languages & Custom Pack Importer.
import React, { useState, useMemo } from 'react';
import {
  Download,
  Globe,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';
import { useI18n, Dict, WORLD_LANGUAGES } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { Badge } from '@/components/atoms/Badge';
import { Label } from '@/components/atoms/Label';

export default function LanguagePage() {
  const {
    t,
    lang,
    setLang,
    languages,
    addLanguage,
    removeLanguage,
    templateJson,
  } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Dict | null>(null);

  const download = () => {
    const blob = new Blob([templateJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm-language-template.en.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (file: File | undefined) => {
    setErr(null);
    setOk(null);
    setParsed(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const valid =
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          Object.values(obj).every((v) => typeof v === 'string');
        if (!valid) throw new Error('invalid');
        setParsed(obj as Dict);
        setOk(`${Object.keys(obj).length} translation keys successfully loaded.`);
      } catch {
        setErr(t('lang.invalid'));
      }
    };
    reader.readAsText(file);
  };

  const add = () => {
    if (!code.trim() || !name.trim() || !parsed) return;
    addLanguage(code.trim().toLowerCase(), name.trim(), parsed);
    setLang(code.trim().toLowerCase());
    setCode('');
    setName('');
    setParsed(null);
    setOk(null);
  };

  const custom = languages.filter((l) => !l.builtin);

  // Filtered world languages
  const filteredWorldLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return WORLD_LANGUAGES.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);
      const matchesRegion =
        selectedRegion === 'All' || item.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const activeLangMeta = WORLD_LANGUAGES.find((l) => l.code === lang);

  return (
    <DashboardTemplate title={t('page.language')}>
      <div className="space-y-6">
        {/* Active Language Highlight */}
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border-brand-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30 text-2xl shadow-inner-soft">
                {activeLangMeta?.flag || '🌐'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {activeLangMeta?.name || lang.toUpperCase()}
                  </h2>
                  <Badge tone="indigo">
                    {activeLangMeta?.nativeName || lang}
                  </Badge>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <Check className="h-3 w-3" /> Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default CRM display language with complete automatic English fallback.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={lang === 'en' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setLang('en')}
                className="text-xs font-semibold"
              >
                <span>🇺🇸 English (Default)</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Global World Language Catalog */}
        <Card className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Choose Any Language in the World
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select your preferred language. All interfaces instantly translate with triple-layer fallback.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language (e.g. Spanish, French, Japanese, Arabic)..."
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none transition hover:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['All', 'Global', 'Europe', 'Americas', 'Asia-Pacific', 'Middle East & Africa'].map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRegion(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    selectedRegion === r
                      ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ),
            )}
          </div>

          {/* Language Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
            {filteredWorldLanguages.map((l) => {
              const isSelected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/15 ring-1 ring-brand-500/30'
                      : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xl">{l.flag}</span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-2 w-full">
                    <div className="truncate text-xs font-bold text-slate-100 group-hover:text-white">
                      {l.name}
                    </div>
                    <div className="truncate text-[10px] text-slate-400 mt-0.5">
                      {l.nativeName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Template download & Add new custom language */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('lang.addTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('lang.templateHint')}
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="h-4 w-4" />
              <span>{t('lang.downloadTemplate')}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="lang-code"
              label={t('lang.codeLabel')}
              placeholder="es, fr, de, it, ja, zh, ar, hi..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <FormField
              id="lang-name"
              label={t('lang.nameLabel')}
              placeholder="Español, Français, Deutsch, 日本語..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('lang.fileLabel')}</Label>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border file:border-slate-700/80 file:bg-slate-900 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-800"
            />
          </div>

          {ok && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{ok}</span>
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={add}
              disabled={!code.trim() || !name.trim() || !parsed}
            >
              <Plus className="h-4 w-4" />
              <span>{t('lang.addButton')}</span>
            </Button>
          </div>
        </Card>

        {/* Custom Installed Languages List */}
        {custom.length > 0 && (
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('lang.custom')}
            </h3>
            <div className="space-y-2">
              {custom.map((l) => (
                <div
                  key={l.code}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{l.name}</span>
                    <Badge tone="indigo">{l.code}</Badge>
                  </div>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                    onClick={() => removeLanguage(l.code)}
                    title={t('lang.remove')}
                    aria-label={t('lang.remove')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardTemplate>
  );
}
