'use client';
// app/(dashboard)/settings/lead-masters/page.tsx — Lead Masters & Taxonomy Config
import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Tag,
  Briefcase,
  AlertCircle,
  Flame,
  Globe,
  Filter,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

type MasterCategory = 'SOURCE' | 'INDUSTRY' | 'LOSS_REASON' | 'RATING';

interface MasterItem {
  id: string;
  category: MasterCategory;
  name: string;
  code: string;
  color: string;
  description?: string;
  isActive: boolean;
  count: number;
}

const initialMasters: MasterItem[] = [
  // Sources
  { id: 'src-1', category: 'SOURCE', name: 'Google Ads (SEM)', code: 'google_ads', color: '#3B82F6', description: 'Inbound high-intent search ads', isActive: true, count: 1420 },
  { id: 'src-2', category: 'SOURCE', name: 'Meta & Instagram', code: 'meta_ads', color: '#8B5CF6', description: 'Social feed carousel campaigns', isActive: true, count: 890 },
  { id: 'src-3', category: 'SOURCE', name: 'Organic Search (SEO)', code: 'organic_search', color: '#10B981', description: 'High-ranking technical blog traffic', isActive: true, count: 2310 },
  { id: 'src-4', category: 'SOURCE', name: 'Partner / Referral', code: 'referral', color: '#F59E0B', description: 'Existing customer and affiliate referrals', isActive: true, count: 540 },
  { id: 'src-5', category: 'SOURCE', name: 'Cold Inbound / Direct', code: 'direct_inbound', color: '#EC4899', description: 'Direct website chat and demo requests', isActive: true, count: 980 },

  // Industries
  { id: 'ind-1', category: 'INDUSTRY', name: 'SaaS & Cloud Software', code: 'saas', color: '#6366F1', description: 'B2B subscription software enterprises', isActive: true, count: 850 },
  { id: 'ind-2', category: 'INDUSTRY', name: 'Fintech & Digital Banking', code: 'fintech', color: '#10B981', description: 'Payments, neo-banks and crypto tech', isActive: true, count: 420 },
  { id: 'ind-3', category: 'INDUSTRY', name: 'Healthcare & Biotech', code: 'healthcare', color: '#06B6D4', description: 'Hospitals, clinics and medical tech', isActive: true, count: 310 },
  { id: 'ind-4', category: 'INDUSTRY', name: 'E-Commerce & Retail', code: 'ecommerce', color: '#F97316', description: 'Omni-channel DTC and retail brands', isActive: true, count: 640 },
  { id: 'ind-5', category: 'INDUSTRY', name: 'Real Estate & Property', code: 'real_estate', color: '#EAB308', description: 'Developers, brokers and asset managers', isActive: true, count: 290 },

  // Loss Reasons
  { id: 'loss-1', category: 'LOSS_REASON', name: 'Budget / Pricing Too High', code: 'budget_pricing', color: '#EF4444', description: 'Prospect requested discounts beyond tier limit', isActive: true, count: 180 },
  { id: 'loss-2', category: 'LOSS_REASON', name: 'Competitor Chosen', code: 'competitor_chosen', color: '#F43F5E', description: 'Selected competing solution or incumbent', isActive: true, count: 120 },
  { id: 'loss-3', category: 'LOSS_REASON', name: 'Missing Required Feature', code: 'missing_feature', color: '#D946EF', description: 'Roadmap timeline does not align with requirement', isActive: true, count: 95 },
  { id: 'loss-4', category: 'LOSS_REASON', name: 'Project Postponed / Frozen', code: 'project_frozen', color: '#64748B', description: 'Internal leadership or budget freeze', isActive: true, count: 140 },
  { id: 'loss-5', category: 'LOSS_REASON', name: 'No Response / Ghosted', code: 'no_response', color: '#94A3B8', description: 'Prospect ceased all communication', isActive: true, count: 210 },

  // Ratings
  { id: 'rat-1', category: 'RATING', name: 'Hot Lead (High Intent)', code: 'hot', color: '#EF4444', description: 'Ready to buy within 30 days', isActive: true, count: 380 },
  { id: 'rat-2', category: 'RATING', name: 'Warm Lead (Evaluating)', code: 'warm', color: '#F59E0B', description: 'Evaluating options in current quarter', isActive: true, count: 720 },
  { id: 'rat-3', category: 'RATING', name: 'Cold Lead (Nurture)', code: 'cold', color: '#3B82F6', description: 'Needs educational drip campaigns', isActive: true, count: 1450 },
];

export default function LeadMastersPage() {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<MasterCategory>('SOURCE');
  const [masters, setMasters] = useState<MasterItem[]>(initialMasters);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<MasterCategory>('SOURCE');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formDesc, setFormDesc] = useState('');

  const tabs: Array<{ key: MasterCategory; label: string; icon: React.ElementType }> = [
    { key: 'SOURCE', label: 'Lead Sources', icon: Globe },
    { key: 'INDUSTRY', label: 'Industry Verticals', icon: Briefcase },
    { key: 'LOSS_REASON', label: 'Deal Loss Reasons', icon: AlertCircle },
    { key: 'RATING', label: 'Ratings & Temperatures', icon: Flame },
  ];

  const filteredItems = masters.filter((m) => {
    const matchCat = m.category === activeTab;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenModal = (item?: MasterItem) => {
    if (item) {
      setEditingItem(item);
      setFormCategory(item.category);
      setFormName(item.name);
      setFormCode(item.code);
      setFormColor(item.color);
      setFormDesc(item.description || '');
    } else {
      setEditingItem(null);
      setFormCategory(activeTab);
      setFormName('');
      setFormCode('');
      setFormColor('#3B82F6');
      setFormDesc('');
    }
    setShowModal(true);
  };

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setMasters((prev) =>
        prev.map((m) =>
          m.id === editingItem.id
            ? { ...m, name: formName, code: formCode, color: formColor, description: formDesc }
            : m
        )
      );
    } else {
      const newItem: MasterItem = {
        id: `master-${Date.now()}`,
        category: formCategory,
        name: formName,
        code: formCode || formName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        color: formColor,
        description: formDesc,
        isActive: true,
        count: 0,
      };
      setMasters((prev) => [...prev, newItem]);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    setMasters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
  };

  const deleteMaster = (id: string) => {
    setMasters((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <DashboardTemplate
      title="Lead Masters & Taxonomy"
      subtitle="Standardize dropdown options, industry classifications, deal loss reasons, and lead ratings"
      actions={
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Master Option
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const count = masters.filter((m) => m.category === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search taxonomy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredItems.length}</strong> items in {activeTab}
          </span>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                item.isActive
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/30 border-slate-800/40 opacity-50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                      <code className="text-[10px] text-slate-500 font-mono">{item.code}</code>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(item.id)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition ${
                      item.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-3 flex items-center justify-between border-t border-slate-800/80 text-xs text-slate-400">
                <span className="text-[11px]">
                  Associated: <strong className="text-white">{item.count} leads</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1 hover:text-primary transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMaster(item.id)}
                    className="p-1 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal for Creating / Editing Master */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Master Option' : 'Create Master Option'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMaster} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Master Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MasterCategory)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="SOURCE">Lead Source</option>
                    <option value="INDUSTRY">Industry Vertical</option>
                    <option value="LOSS_REASON">Deal Loss Reason</option>
                    <option value="RATING">Lead Rating / Temperature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Option Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Google Ads"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Unique Code / Slug</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. google_ads"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Badge Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-9 h-9 p-0.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 font-mono">{formColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief description of this master option"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Option
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
}
