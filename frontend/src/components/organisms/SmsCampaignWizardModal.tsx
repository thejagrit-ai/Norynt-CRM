'use client';
// src/components/organisms/SmsCampaignWizardModal.tsx — 4-Step SMS Campaign Creation Wizard matching Screenshot 4.
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  MessageSquare,
  Smartphone,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  Server,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DatePicker } from '@/components/atoms/DatePicker';

export interface SmsCampaignWizardModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function SmsCampaignWizardModal({ onClose, onSuccess }: SmsCampaignWizardModalProps) {
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<'EZCRM' | 'Twilio' | 'MSG91'>('EZCRM');
  const [senderId, setSenderId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00');

  // Step 2: Template / Message
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');

  // Step 3: Audience
  const [audienceType, setAudienceType] = useState<'all' | 'groups'>('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  // Fetch Lead Groups for Audience Step
  const groupsQuery = useQuery({
    queryKey: ['lead-groups'],
    queryFn: async () => {
      const res = await api.get('/lead-groups');
      return unwrap<any[]>(res.data);
    },
  });

  // Fetch SMS Templates
  const templatesQuery = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: async () => {
      const res = await api.get('/campaigns/templates');
      return unwrap<any[]>(res.data);
    },
  });

  const availableSmsTemplates = (templatesQuery.data || []).filter(
    (t) => t.channel === 'SMS'
  );

  const charCount = message.length;
  const creditsNeeded = Math.ceil(charCount / 160) || 1;

  const handleInsertToken = (token: string) => {
    setMessage((prev) => prev + ` {{${token}}}`);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = availableSmsTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setMessage(tpl.content);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const scheduleIso =
        scheduledAt && scheduledTime
          ? new Date(`${scheduledAt}T${scheduledTime}`).toISOString()
          : scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined;

      const payload = {
        name: name.trim(),
        senderId: senderId || 'NORYNT',
        message: message.trim(),
        scheduledAt: scheduleIso,
      };

      await api.post('/campaigns/sms', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['campaigns-sms'] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!name.trim()) errs.name = 'Campaign name is required';
    } else if (step === 2) {
      if (!message.trim()) errs.message = 'SMS message text is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(4, s + 1) as any);
    }
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(1, s - 1) as any);
  };

  if (!mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] my-auto overflow-hidden rounded-3xl border border-slate-700/90 bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>SMS Campaigns</span>
                <span>›</span>
                <span className="text-white font-medium">New Campaign</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                New SMS Campaign
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Stepper Header (Matching Screenshot 4) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Template' },
              { num: 3, label: 'Audience' },
              { num: 4, label: 'Review' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (isPast || validateStep(currentStep)) {
                      setCurrentStep(step.num as any);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isPast
                      ? 'bg-slate-800/90 text-blue-300 hover:text-white'
                      : 'text-slate-500 bg-slate-950/40 hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : isPast
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : step.num}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono">Step {currentStep} of 4</span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* STEP 1: DETAILS (Matching Screenshot 4) */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Campaign Details</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure SMS gateway provider, registered DLT header, and scheduling.
                </p>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campaign Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Sale Announcement / VIP Flash Discount"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-800/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-sm ${
                    errors.name ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* SMS Provider (Matching Screenshot 4) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  SMS Provider <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'EZCRM', name: 'EZCRM', tag: 'Default', sub: 'Custom Direct Relay' },
                    { id: 'MSG91', name: 'MSG91 (India DLT)', tag: 'TRAI Compliant', sub: 'DLT Registered Route' },
                    { id: 'Twilio', name: 'Twilio Cloud', tag: 'Global', sub: 'International Carrier' },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setProvider(p.id as any)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between ${
                        provider === p.id
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">{p.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sender ID (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sender ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MYSHOP / NORYNT"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white uppercase tracking-wider focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Schedule (Optional) */}
              <div>
                <DatePicker
                  label="Schedule (Optional — Leave empty to send immediately)"
                  value={scheduledAt}
                  onChange={(v) => setScheduledAt(v)}
                  placeholder="Select date & time..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Select Template & Compose</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a pre-approved template or compose text with dynamic variables.
                  </p>
                </div>

                {availableSmsTemplates.length > 0 && (
                  <div className="w-56">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">— Load SMS Template —</option>
                      {availableSmsTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Personalization Variable Chips */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Insert Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: 'firstName', label: 'First Name' },
                    { token: 'companyName', label: 'Company' },
                    { token: 'phone', label: 'Phone' },
                    { token: 'offerCode', label: 'Offer Code' },
                  ].map((chip) => (
                    <button
                      key={chip.token}
                      type="button"
                      onClick={() => handleInsertToken(chip.token)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono transition"
                    >
                      + {`{{${chip.token}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    SMS Message Text <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-xs font-mono text-blue-400">
                    {charCount}/160 chars ({creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''})
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500 shadow-inner ${
                    errors.message ? 'border-rose-500' : 'border-slate-800'
                  }`}
                  placeholder="Type your SMS message..."
                />
                {errors.message && <p className="text-xs text-rose-400 mt-1">{errors.message}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: AUDIENCE */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Target Audience</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select which contact cohorts or lead groups receive this SMS campaign.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'all', title: 'All CRM Contacts with Valid Phone', desc: 'Broadcast to all available mobile numbers' },
                  { id: 'groups', title: 'Targeted Lead Groups', desc: 'Filter by specific sales lead group' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setAudienceType(aud.id as any)}
                    className={`p-4 rounded-2xl border text-left transition select-none flex flex-col justify-between ${
                      audienceType === aud.id
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{aud.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1">{aud.desc}</p>
                    </div>
                    {audienceType === aud.id && (
                      <span className="text-[10px] font-bold text-blue-400 mt-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {audienceType === 'groups' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Lead Groups
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(groupsQuery.data || []).map((grp) => {
                      const isChecked = selectedGroupIds.includes(grp.id);
                      return (
                        <div
                          key={grp.id}
                          onClick={() => {
                            setSelectedGroupIds((prev) =>
                              prev.includes(grp.id)
                                ? prev.filter((x) => x !== grp.id)
                                : [...prev, grp.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-600/15 border-blue-500/50 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: grp.color || '#3b82f6' }}
                            />
                            <span className="text-xs font-semibold text-white">{grp.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {grp._count?.members || 0} leads
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Review & Dispatch</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm your campaign parameters and credit consumption before launching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Campaign Summary
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p>
                      <strong className="text-white">Name:</strong> {name}
                    </p>
                    <p>
                      <strong className="text-white">Gateway Provider:</strong> {provider}
                    </p>
                    <p>
                      <strong className="text-white">Sender ID:</strong> {senderId || 'NORYNT'}
                    </p>
                    <p>
                      <strong className="text-white">Credits per SMS:</strong> {creditsNeeded} credit
                    </p>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Gateway Status
                  </span>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>DLT Route Active & Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Instant delivery via Indian telecom carriers.
                  </p>
                </Card>
              </div>

              {/* Message Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  SMS Preview
                </span>
                <div className="text-xs text-slate-200 font-mono bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div>
            {currentStep > 1 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrev}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>

            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 px-6 shadow-lg shadow-blue-600/30"
                leftIcon={<Send className="w-4 h-4" />}
              >
                {mutation.isPending ? 'Dispatching...' : 'Schedule & Dispatch SMS'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
