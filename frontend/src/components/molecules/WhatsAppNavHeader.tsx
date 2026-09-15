'use client';
// src/components/molecules/WhatsAppNavHeader.tsx — Unified Omnichannel WhatsApp Sub-Navigation
import React, { useState } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Radio,
  FileText,
  Zap,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Webhook,
  BookOpen,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { Button } from '@/components/atoms/Button';
import { WhatsAppWebhookModal } from '../organisms/WhatsAppWebhookModal';

interface WhatsAppStatus {
  connected: boolean;
  phoneNumberId?: string;
  hasAppSecret?: boolean;
  hasVerifyToken?: boolean;
  verifyToken?: string;
}

export function WhatsAppNavHeader({
  onOpenSetup,
}: {
  onOpenSetup?: () => void;
}) {
  const pathname = usePathname();
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const status = useQuery({
    queryKey: ['wa-status'],
    queryFn: async () =>
      unwrap<WhatsAppStatus>((await api.get('/whatsapp/status')).data),
    staleTime: 15_000,
  });

  const isConnected = status.data?.connected;

  const navTabs = [
    {
      href: '/whatsapp',
      label: 'Live Inbox',
      icon: MessageSquare,
      exact: true,
    },
    {
      href: '/whatsapp/broadcasts',
      label: 'Broadcasts',
      icon: Radio,
    },
    {
      href: '/whatsapp/templates',
      label: 'HSM Templates',
      icon: FileText,
    },
    {
      href: '/whatsapp/quick-replies',
      label: 'Quick Replies',
      icon: Zap,
    },
    {
      href: '/whatsapp/workflows',
      label: 'Workflows',
      icon: GitBranch,
    },
  ];

  const handleOpenSetup = () => {
    if (onOpenSetup) {
      onOpenSetup();
    } else {
      setSetupModalOpen(true);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
          {navTabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <NextLink
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 dark:bg-emerald-500'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </NextLink>
            );
          })}
        </div>

        {/* Setup & Connection Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleOpenSetup}
            className={`flex items-center gap-2 rounded-xl text-xs font-bold transition-all ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {isConnected ? (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Webhook className="h-3.5 w-3.5" />
                <span>Meta API & Webhook Settings</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                <span>Link WhatsApp & Webhook</span>
              </>
            )}
          </Button>

          <NextLink
            href="/connections/guide"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 shadow-xs transition"
            title="View Setup Guide"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </NextLink>
        </div>
      </div>

      {setupModalOpen && (
        <WhatsAppWebhookModal onClose={() => setSetupModalOpen(false)} />
      )}
    </>
  );
}
