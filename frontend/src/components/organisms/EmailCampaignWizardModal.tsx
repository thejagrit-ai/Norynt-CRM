'use client';
// src/components/organisms/EmailCampaignWizardModal.tsx — 4-Step Email Campaign Creation Wizard matching reference.
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Mail,
  Users,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Server,
  ArrowLeft,
  ArrowRight,
  Send,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DatePicker } from '@/components/atoms/DatePicker';
import { Select, type SelectOption } from '@/components/atoms/Select';

export interface EmailCampaignWizardModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmailCampaignWizardModal({ onClose, onSuccess }: EmailCampaignWizardModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState<'single' | 'sequence'>('single');
  const [subjectLines, setSubjectLines] = useState<string[]>(['']);
  const [replyTo, setReplyTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [maxHourlyEmails, setMaxHourlyEmails] = useState('500');
  const [selectedSmtps, setSelectedSmtps] = useState<string[]>(['smtp-primary']);

  // Step 2: Audience
  const [audienceType, setAudienceType] = useState<'all' | 'groups' | 'segments'>('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Step 3: Content
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [fromName, setFromName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [fromEmail, setFromEmail] = useState(user?.email || '');
  const [emailBody, setEmailBody] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFromName((prev) => prev || `${user.firstName} ${user.lastName}`);
      setFromEmail((prev) => prev || user.email || '');
    }
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [user]);

  // Fetch Lead Groups for Audience Step
  const groupsQuery = useQuery({
    queryKey: ['lead-groups'],
    queryFn: async () => {
      const res = await api.get('/lead-groups');
      return unwrap<any[]>(res.data);
    },
  });

  // Fetch Templates
  const templatesQuery = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: async () => {
      const res = await api.get('/campaigns/templates');
      return unwrap<any[]>(res.data);
    },
  });

  // Fetch Real SMTP Settings
  const smtpQuery = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/email/settings');
        return unwrap<any>(res.data);
      } catch {
        return null;
      }
    },
  });

  const availableTemplates = (templatesQuery.data || []).filter(
    (t) => t.channel === 'EMAIL' || !t.channel
  );

  const smtpOptions = smtpQuery.data?.host
    ? [
        {
          id: 'smtp-primary',
          name: `${smtpQuery.data.fromName || 'Primary SMTP Relay'} (${smtpQuery.data.host})`,
          email: smtpQuery.data.from || smtpQuery.data.user || user?.email || '',
          host: `${smtpQuery.data.host}:${smtpQuery.data.port || 587}`,
          dailyLimit: 'Active Relay',
        },
      ]
    : [];

  const handleAddSubject = () => {
    setSubjectLines([...subjectLines, '']);
  };

  const handleRemoveSubject = (idx: number) => {
    if (subjectLines.length <= 1) return;
    setSubjectLines(subjectLines.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx: number, val: string) => {
    const next = [...subjectLines];
    next[idx] = val;
    setSubjectLines(next);
  };

  const handleInsertToken = (token: string) => {
    setEmailBody((prev) => prev + ` {{${token}}}`);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = availableTemplates.find((t) => t.id === templateId);
    if (tpl) {
      if (tpl.subject && subjectLines[0] === '') {
        setSubjectLines([tpl.subject]);
      }
      setEmailBody(tpl.content);
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
        subject: subjectLines[0] || 'Exclusive Update from Norynt',
        previewText: subjectLines[1] || undefined,
        fromName,
        fromEmail,
        content: emailBody,
        scheduledAt: scheduleIso,
        replyTo: replyTo || undefined,
        cc: cc || undefined,
        bcc: bcc || undefined,
        campaignType,
        maxHourlyEmails: Number(maxHourlyEmails) || 500,
      };

      await api.post('/campaigns/email', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['campaigns-email'] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!name.trim()) errs.name = 'Campaign name is required';
      if (!subjectLines[0]?.trim()) errs.subject = 'Primary subject line is required';
      if (selectedSmtps.length === 0) errs.smtp = 'Please select at least one SMTP relay';
    } else if (step === 3) {
      if (!emailBody.trim()) errs.content = 'Email body content cannot be empty';
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
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] my-auto overflow-hidden rounded-3xl border border-slate-700/90 bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Email Campaigns</span>
                <span>›</span>
                <span className="text-white font-medium">New Campaign</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                Create Email Broadcast & Sequence
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Step Stepper Header (Matching Screenshot 2) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Audience' },
              { num: 3, label: 'Content' },
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isPast
                      ? 'bg-slate-800/90 text-indigo-300 hover:text-white'
                      : 'text-slate-500 bg-slate-950/40 hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : isPast
                        ? 'bg-indigo-500/20 text-indigo-300'
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
          {/* STEP 1: DETAILS (Matching Screenshot 2) */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Campaign Details</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Name your campaign, setup subject lines, sender info, and SMTP relay servers.
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
                  placeholder="e.g. Q3 Enterprise Tech Newsletter / Product Launch Blast"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-800/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm ${
                    errors.name ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Campaign Type: Single Send vs Email Sequence */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campaign Type
                </label>
                <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCampaignType('single')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                      campaignType === 'single'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Single Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignType('sequence')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                      campaignType === 'sequence'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Email Sequence (Drip)
                  </button>
                </div>
              </div>

              {/* Subject Lines (Multi A/B Testing) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Subject Lines <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject for A/B Testing</span>
                  </button>
                </div>

                {subjectLines.map((subj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 w-6">
                      {idx === 0 ? 'A:' : `B${idx}:`}
                    </span>
                    <input
                      type="text"
                      placeholder={
                        idx === 0
                          ? 'e.g. Accelerate your cloud pipeline with Norynt'
                          : 'Alternative subject line for variance testing...'
                      }
                      value={subj}
                      onChange={(e) => handleSubjectChange(idx, e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {subjectLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(idx)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.subject && <p className="text-xs text-rose-400">{errors.subject}</p>}
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Reply-To, CC, BCC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reply-To Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="support@yourcompany.com"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CC (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="manager@yourcompany.com"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BCC (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="archive@yourcompany.com"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scheduling & Rate Limiting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    label="Schedule Delivery (Optional — Leave empty to send manually)"
                    value={scheduledAt}
                    onChange={(v) => setScheduledAt(v)}
                    placeholder="Select broadcast date..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Hourly Emails (Rate Limiting)
                  </label>
                  <input
                    type="number"
                    value={maxHourlyEmails}
                    onChange={(e) => setMaxHourlyEmails(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SMTP Configurations */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  SMTP Configuration <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Select available SMTP server for email campaign dispatch.
                </p>

                {smtpOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-center">
                    <Server className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-300">No SMTP configurations available</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure an outbound SMTP account first in Settings &rarr; Integrations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smtpOptions.map((smtp) => {
                      const isChecked = selectedSmtps.includes(smtp.id);
                      return (
                        <div
                          key={smtp.id}
                          onClick={() => {
                            if (isChecked) {
                              if (selectedSmtps.length > 1) {
                                setSelectedSmtps(selectedSmtps.filter((x) => x !== smtp.id));
                              }
                            } else {
                              setSelectedSmtps([...selectedSmtps, smtp.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">{smtp.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {smtp.email} · {smtp.host}
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {smtp.dailyLimit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.smtp && <p className="text-xs text-rose-400 mt-1">{errors.smtp}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: AUDIENCE */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Target Audience</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select which customer contacts, lead groups, or segments receive this campaign.
                </p>
              </div>

              {/* Audience Type selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'all', title: 'All Active Leads', desc: 'Broadcast to all qualified contacts in CRM' },
                  { id: 'groups', title: 'Targeted Lead Groups', desc: 'Filter by specific sales lead groups' },
                  { id: 'segments', title: 'Dynamic Segments', desc: 'Filter by role, company tier, or stage' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setAudienceType(aud.id as any)}
                    className={`p-4 rounded-2xl border text-left transition select-none flex flex-col justify-between ${
                      audienceType === aud.id
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{aud.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1">{aud.desc}</p>
                    </div>
                    {audienceType === aud.id && (
                      <span className="text-[10px] font-bold text-indigo-400 mt-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Group Checkboxes if 'groups' is selected */}
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
                              ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: grp.color || '#6366f1' }}
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

          {/* STEP 3: CONTENT */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Email Content & Design</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose a saved template or customize body text with live personalization tokens.
                  </p>
                </div>

                {availableTemplates.length > 0 && (
                  <div className="w-56">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">— Load from Template —</option>
                      {availableTemplates.map((t) => (
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
                  Insert Personalization Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: 'firstName', label: 'First Name' },
                    { token: 'lastName', label: 'Last Name' },
                    { token: 'companyName', label: 'Company' },
                    { token: 'email', label: 'Email' },
                    { token: 'dealValue', label: 'Deal Value' },
                    { token: 'senderName', label: 'My Name' },
                  ].map((chip) => (
                    <button
                      key={chip.token}
                      type="button"
                      onClick={() => handleInsertToken(chip.token)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition"
                    >
                      + {`{{${chip.token}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Content Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Message Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={9}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner ${
                    errors.content ? 'border-rose-500' : 'border-slate-800'
                  }`}
                  placeholder="Write your email body here..."
                />
                {errors.content && <p className="text-xs text-rose-400 mt-1">{errors.content}</p>}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold text-white">Review Campaign Summary</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify your sender configuration, subject line variance, and launch parameters.
                </p>
              </div>

              {/* Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Campaign Specs
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p>
                      <strong className="text-white">Name:</strong> {name}
                    </p>
                    <p>
                      <strong className="text-white">Type:</strong>{' '}
                      {campaignType === 'single' ? 'Single Send Broadcast' : 'Automated Drip Sequence'}
                    </p>
                    <p>
                      <strong className="text-white">From:</strong> {fromName} &lt;{fromEmail}&gt;
                    </p>
                    <p>
                      <strong className="text-white">Delivery:</strong>{' '}
                      {scheduledAt ? `Scheduled for ${scheduledAt} ${scheduledTime}` : 'Immediate / Manual'}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Deliverability Check
                  </span>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Spam Score 0.1/10 (Safe & Optimal)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    DKIM, SPF, and DMARC aligned with selected SMTP relays.
                  </p>
                </Card>
              </div>

              {/* Subject Lines Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Subject Line Variants
                </span>
                {subjectLines.map((s, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-indigo-300">
                      Variant {idx + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              {/* Email Body Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Content Preview
                </span>
                <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {emailBody}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
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
                className="bg-indigo-600 hover:bg-indigo-500"
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
                className="bg-indigo-600 hover:bg-indigo-500 px-6 shadow-lg shadow-indigo-600/30"
                leftIcon={<Send className="w-4 h-4" />}
              >
                {mutation.isPending ? 'Launching...' : 'Schedule & Launch Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
