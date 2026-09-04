'use client';
// src/components/organisms/BrandWizardModal.tsx — brand onboarding questionnaire modal with light/dark theme.
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export function BrandWizardModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState({
    name: '',
    sector: '',
    niche: '',
    description: '',
    targetAudience: '',
    priceBand: 'mid',
    markets: 'IN',
    keywords: '',
    knownCompetitors: '',
  });
  const set = (k: keyof typeof f, v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post('/brands', {
        name: f.name.trim(),
        sector: f.sector || undefined,
        niche: f.niche || undefined,
        description: f.description || undefined,
        targetAudience: f.targetAudience || undefined,
        priceBand: f.priceBand,
        markets: list(f.markets).map((m) => m.toUpperCase()),
        keywords: list(f.keywords),
        knownCompetitors: list(f.knownCompetitors),
      });
      return res.data.data.id as string;
    },
    onSuccess: (id) => onSaved(id),
  });

  return (
    <Modal title={t('brand.new') || 'Add New Brand'} onClose={onClose}>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        {t('brand.wizardHint') || 'Configure your brand parameters to customize the AI branding voice.'}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="b-name"
          label={`${t('brand.name') || 'Brand Name'} *`}
          value={f.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <FormField
          id="b-sector"
          label={t('brand.sector') || 'Industry Sector'}
          placeholder="SaaS, E-commerce, Fintech..."
          value={f.sector}
          onChange={(e) => set('sector', e.target.value)}
        />
        <FormField
          id="b-niche"
          label={t('brand.niche') || 'Market Niche'}
          placeholder="Enterprise B2B, Direct-to-Consumer..."
          value={f.niche}
          onChange={(e) => set('niche', e.target.value)}
        />
        <div>
          <Label>{t('brand.priceBand') || 'Price Segment'}</Label>
          <select
            value={f.priceBand}
            onChange={(e) => set('priceBand', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100"
          >
            <option value="budget" className="bg-white dark:bg-slate-900">{t('brand.priceBudget') || 'Budget'}</option>
            <option value="mid" className="bg-white dark:bg-slate-900">{t('brand.priceMid') || 'Mid-range'}</option>
            <option value="premium" className="bg-white dark:bg-slate-900">{t('brand.pricePremium') || 'Premium'}</option>
            <option value="luxury" className="bg-white dark:bg-slate-900">{t('brand.priceLuxury') || 'Luxury'}</option>
          </select>
        </div>
        <FormField
          id="b-audience"
          label={t('brand.audience') || 'Target Audience'}
          placeholder="e.g. 25-45 years, business owners"
          value={f.targetAudience}
          onChange={(e) => set('targetAudience', e.target.value)}
        />
        <FormField
          id="b-markets"
          label={t('brand.markets') || 'Target Country Codes'}
          placeholder="IN, US, UK, AE"
          value={f.markets}
          onChange={(e) => set('markets', e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Label>{t('brand.description') || 'Brand Overview'}</Label>
        <Textarea
          rows={2}
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Brief summary of brand mission and positioning..."
        />
      </div>
      <div className="mt-4">
        <FormField
          id="b-keywords"
          label={t('brand.keywords') || 'Keywords (comma-separated)'}
          placeholder="crm, automation, cloud, enterprise"
          value={f.keywords}
          onChange={(e) => set('keywords', e.target.value)}
        />
      </div>
      <div className="mt-4">
        <FormField
          id="b-comp"
          label={t('brand.competitors') || 'Key Competitors (comma-separated)'}
          placeholder="HubSpot, Salesforce, Zoho"
          value={f.knownCompetitors}
          onChange={(e) => set('knownCompetitors', e.target.value)}
        />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !f.name.trim()}
            loading={create.isPending}
          >
            <Sparkles className="h-4 w-4" />
            <span>{t('common.create') || 'Create Brand'}</span>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        {create.isError && (
          <span className="text-xs font-medium text-rose-500 dark:text-rose-400">
            {t('common.error') || 'Failed to create brand.'}
          </span>
        )}
      </div>
    </Modal>
  );
}
