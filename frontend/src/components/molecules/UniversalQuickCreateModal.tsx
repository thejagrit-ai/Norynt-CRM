'use client';
// src/components/molecules/UniversalQuickCreateModal.tsx — Minimal-click universal quick-creation modal with i18n & Portal.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckSquare,
  Users,
  LifeBuoy,
  Building2,
  Plus,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { Label } from '@/components/atoms/Label';

export function UniversalQuickCreateModal({
  isOpen,
  initialType = 'deal',
  onClose,
}: {
  isOpen: boolean;
  initialType?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState(initialType);
  const modalRef = useRef<HTMLDivElement>(null);

  const [dealForm, setDealForm] = useState({ title: '', value: '', company: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM', dueDate: '' });
  const [leadForm, setLeadForm] = useState({ firstName: '', lastName: '', email: '', companyName: '' });
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const createDeal = useMutation({
    mutationFn: (v: any) => api.post('/deals', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['board'] });
      onClose();
    },
  });

  const createTask = useMutation({
    mutationFn: (v: any) => api.post('/tasks', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const createLead = useMutation({
    mutationFn: (v: any) => api.post('/leads', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
  });

  const createTicket = useMutation({
    mutationFn: (v: any) => api.post('/tickets', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
  });

  const createContact = useMutation({
    mutationFn: (v: any) => api.post('/contacts', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
  });

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'deal') {
      if (!dealForm.title.trim()) return;
      createDeal.mutate(dealForm);
    } else if (type === 'task') {
      if (!taskForm.title.trim()) return;
      createTask.mutate({
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
      });
    } else if (type === 'lead') {
      if (!leadForm.firstName.trim() || !leadForm.lastName.trim()) return;
      createLead.mutate(leadForm);
    } else if (type === 'ticket') {
      if (!ticketForm.subject.trim() || !ticketForm.description.trim()) return;
      createTicket.mutate(ticketForm);
    } else if (type === 'contact') {
      if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) return;
      createContact.mutate(contactForm);
    }
  };

  const isPending =
    createDeal.isPending ||
    createTask.isPending ||
    createLead.isPending ||
    createTicket.isPending ||
    createContact.isPending;

  const tabs = [
    { key: 'deal', label: t('qc.deal') || 'Deal', icon: <Briefcase className="h-3.5 w-3.5" /> },
    { key: 'task', label: t('qc.task') || 'Task', icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { key: 'lead', label: t('qc.lead') || 'Lead', icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'ticket', label: t('qc.ticket') || 'Ticket', icon: <LifeBuoy className="h-3.5 w-3.5" /> },
    { key: 'contact', label: t('qc.contact') || 'Contact', icon: <Users className="h-3.5 w-3.5" /> },
  ];

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] my-auto overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95 dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10 animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {t('qc.modalTitle') || 'Quick Create'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex shrink-0 border-b border-slate-100 bg-slate-50/50 p-2 gap-1.5 overflow-x-auto dark:border-slate-800/80 dark:bg-slate-950/60">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                type === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {type === 'deal' && (
            <>
              <FormField
                id="qd-title"
                label={t('field.subject') || 'Title'}
                placeholder="Acme Enterprise Subscription"
                value={dealForm.title}
                onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="qd-val"
                  label={t('field.value') || 'Value'}
                  type="number"
                  placeholder="5000"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                />
                <FormField
                  id="qd-comp"
                  label={t('field.company') || 'Company'}
                  placeholder="Acme Inc."
                  value={dealForm.company}
                  onChange={(e) => setDealForm({ ...dealForm, company: e.target.value })}
                />
              </div>
            </>
          )}

          {type === 'task' && (
            <>
              <FormField
                id="qt-title"
                label={t('tasks.title') || 'Task Title'}
                placeholder="Follow up with prospect"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="qt-priority">{t('field.priority') || 'Priority'}</Label>
                  <select
                    id="qt-priority"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="LOW">{t('priority.low') || 'Low'}</option>
                    <option value="MEDIUM">{t('priority.medium') || 'Medium'}</option>
                    <option value="HIGH">{t('priority.high') || 'High'}</option>
                    <option value="URGENT">{t('priority.urgent') || 'Urgent'}</option>
                  </select>
                </div>
                <FormField
                  id="qt-due"
                  label={t('field.dueDate') || 'Due Date'}
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
            </>
          )}

          {type === 'lead' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="ql-first"
                  label={t('field.firstName') || 'First Name'}
                  placeholder="John"
                  value={leadForm.firstName}
                  onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                  required
                />
                <FormField
                  id="ql-last"
                  label={t('field.lastName') || 'Last Name'}
                  placeholder="Doe"
                  value={leadForm.lastName}
                  onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                  required
                />
              </div>
              <FormField
                id="ql-email"
                label={t('field.email') || 'Email'}
                type="email"
                placeholder="john@example.com"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                required
              />
              <FormField
                id="ql-company"
                label={t('field.company') || 'Company Name'}
                placeholder="Acme Corp"
                value={leadForm.companyName}
                onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
              />
            </>
          )}

          {type === 'ticket' && (
            <>
              <FormField
                id="qtk-subj"
                label={t('field.subject') || 'Subject'}
                placeholder="Unable to integrate API"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                required
              />
              <FormField
                id="qtk-desc"
                label={t('field.description') || 'Description'}
                placeholder="Provide detailed description..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                required
              />
            </>
          )}

          {type === 'contact' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="qc-first"
                  label={t('field.firstName') || 'First Name'}
                  placeholder="Jane"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  required
                />
                <FormField
                  id="qc-last"
                  label={t('field.lastName') || 'Last Name'}
                  placeholder="Smith"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  required
                />
              </div>
              <FormField
                id="qc-email"
                label={t('field.email') || 'Email'}
                type="email"
                placeholder="jane@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button size="sm" type="submit" loading={isPending}>
              <Plus className="h-3.5 w-3.5" />
              <span>{t('qc.createBtn') || 'Create Record'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
