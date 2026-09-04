'use client';
// src/components/molecules/NavItem.tsx — Premium SaaS navigation link with active state, hover effects & collapsed tooltips.
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { NAVIGATION_CONFIG } from '@/config/navigation';

// All registered nav paths sorted by descending length to ensure most specific match wins
const ALL_NAV_HREFS = [
  NAVIGATION_CONFIG.dashboard.href,
  ...NAVIGATION_CONFIG.groups.flatMap((g) => g.items.map((i) => i.href)),
].sort((a, b) => b.length - a.length);

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;

  if (pathname.startsWith(`${href}/`)) {
    const bestMatch = ALL_NAV_HREFS.find(
      (h) => h !== '/' && (pathname === h || pathname.startsWith(`${h}/`))
    );
    return bestMatch === href;
  }

  return false;
}

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
  active?: boolean;
  badge?: 'ai' | 'new';
  onClick?: () => void;
}

export function NavItem({
  href,
  label,
  icon: Icon,
  collapsed = false,
  active: propActive,
  badge,
  onClick,
}: NavItemProps) {
  const pathname = usePathname();
  const active = propActive !== undefined ? propActive : isNavActive(pathname, href);

  if (collapsed) {
    return (
      <div className="relative group flex justify-center w-full my-0.5">
        <Link
          href={href}
          prefetch={true}
          scroll={false}
          onClick={onClick}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 select-none ${
            active
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-hover:scale-105" />
          {badge === 'ai' && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          )}
        </Link>

        {/* Floating Tooltip in Collapsed Mode */}
        <div
          role="tooltip"
          className="fixed left-[76px] z-50 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none whitespace-nowrap animate-fade-in"
        >
          <span>{label}</span>
          {badge === 'ai' && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
              AI
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13px] leading-5 transition-all duration-150 select-none ${
        active
          ? 'bg-indigo-500/15 text-white font-semibold ring-1 ring-indigo-500/30 shadow-sm'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
      }`}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 items-center gap-3 truncate">
        <Icon
          className={`h-4.5 w-4.5 shrink-0 transition-colors duration-150 ${
            active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        />
        <span className="truncate">{label}</span>
      </div>

      {badge === 'ai' && (
        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          AI
        </span>
      )}
    </Link>
  );
}
