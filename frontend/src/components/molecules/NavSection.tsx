'use client';
// src/components/molecules/NavSection.tsx — Lightweight expandable section header with collapsed divider support.
import React, { Children, ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

export function NavSection({
  title,
  icon: Icon,
  children,
  open = true,
  onToggle,
  collapsed = false,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  open?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
}) {
  const visible = Children.toArray(children).filter(Boolean).length;
  if (visible === 0) return null;

  if (collapsed) {
    return (
      <div className="w-full my-2">
        <div className="w-8 mx-auto border-t border-slate-800/80 my-1.5" />
        <div className="flex flex-col items-center gap-1">{children}</div>
      </div>
    );
  }

  const collapsible = typeof onToggle === 'function';

  return (
    <div className="pt-3 first:pt-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={!collapsible}
        aria-expanded={collapsible ? open : undefined}
        className={`group mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 ${
          collapsible
            ? 'hover:bg-slate-800/40 cursor-pointer text-slate-400 hover:text-slate-200'
            : 'cursor-default text-slate-500'
        }`}
      >
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wider text-slate-400 select-none">
          {title}
        </span>
        {collapsible && (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-slate-200 ${
              open ? '' : '-rotate-90'
            }`}
          />
        )}
      </button>

      {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  );
}
