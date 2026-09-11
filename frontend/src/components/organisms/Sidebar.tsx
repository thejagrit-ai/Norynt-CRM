'use client';
// src/components/organisms/Sidebar.tsx — Production-grade, optimized CRM sidebar with collapse/expand, auto-expansion, RBAC, and responsive drawer.
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useSidebar } from '@/lib/sidebar';
import { NAVIGATION_CONFIG, type NavGroup, type NavLeaf } from '@/config/navigation';
import { NavItem, isNavActive } from '../molecules/NavItem';
import { NavSection } from '../molecules/NavSection';
import { Logo } from '../molecules/Logo';

const LS_COLLAPSED_SECTIONS = 'norynt_crm_nav_collapsed_sections';
const SS_SIDEBAR_SCROLL = 'norynt_crm_sidebar_scroll_top';

// In-memory persistent scroll value across client component unmount/remount
let persistentSidebarScrollTop = 0;

export function Sidebar({
  mobileOpen: propMobileOpen,
  onCloseMobile: propOnCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const { can } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const {
    isCollapsed,
    toggleCollapse,
    isMobileOpen: ctxMobileOpen,
    closeMobile: ctxCloseMobile,
  } = useSidebar();

  const isMobile = propMobileOpen !== undefined ? propMobileOpen : ctxMobileOpen;
  const handleCloseMobile = propOnCloseMobile || ctxCloseMobile;

  const navRef = useRef<HTMLElement>(null);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!navRef.current) return;
    let target = persistentSidebarScrollTop;
    if (target === 0 && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(SS_SIDEBAR_SCROLL);
        if (saved) target = parseFloat(saved) || 0;
      } catch {}
    }
    if (target > 0 && navRef.current) {
      navRef.current.scrollTop = target;
    }
  }, []);

  // Track collapsed section IDs in expanded sidebar mode
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLLAPSED_SECTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCollapsedSections(parsed.filter((x) => typeof x === 'string'));
        }
      }
    } catch {
      /* ignore */
    }
    setSectionsLoaded(true);
  }, []);

  // Restore scroll on mount, section change, and route change
  useEffect(() => {
    restoreScrollPosition();
    const t1 = setTimeout(restoreScrollPosition, 10);
    const t2 = setTimeout(restoreScrollPosition, 50);
    const t3 = setTimeout(restoreScrollPosition, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, sectionsLoaded, collapsedSections, restoreScrollPosition]);

  const handleNavScroll = (e: React.UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop;
    persistentSidebarScrollTop = top;
    try {
      sessionStorage.setItem(SS_SIDEBAR_SCROLL, top.toString());
    } catch {}
  };

  // Automatically expand parent section if current route matches a child item
  useEffect(() => {
    if (!pathname) return;
    for (const group of NAVIGATION_CONFIG.groups) {
      const hasActiveChild = group.items.some((item) => isNavActive(pathname, item.href));
      if (hasActiveChild) {
        setCollapsedSections((prev) => {
          if (prev.includes(group.id)) {
            const next = prev.filter((id) => id !== group.id);
            try {
              localStorage.setItem(LS_COLLAPSED_SECTIONS, JSON.stringify(next));
            } catch {
              /* ignore */
            }
            return next;
          }
          return prev;
        });
      }
    }
  }, [pathname]);

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(LS_COLLAPSED_SECTIONS, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Global keyboard shortcuts (Ctrl+\, Cmd+\, Ctrl+B) to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === '\\' || e.key.toLowerCase() === 'b')
      ) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          toggleCollapse();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  // Filter groups and items by user permissions
  const filteredGroups = useMemo(() => {
    return NAVIGATION_CONFIG.groups
      .map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (!item.perms || item.perms.length === 0) return true;
          return item.perms.some((p) => can(p));
        });
        return { ...group, items: visibleItems };
      })
      .filter((group) => group.items.length > 0);
  }, [can]);

  const sidebarContent = (
    <div
      className={`flex h-full flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-200 ease-in-out select-none ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Top Header: Logo & Collapse Toggle */}
      {isCollapsed ? (
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-slate-800/80 px-2">
          <button
            type="button"
            onClick={toggleCollapse}
            title="Expand Sidebar (Ctrl+\)"
            aria-label="Expand Sidebar"
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:border-brand-500/60 hover:bg-brand-600 hover:text-white shadow-sm transition-all duration-200 select-none"
          >
            <ChevronRight className="h-5 w-5 group-hover:scale-115 transition-transform" />
          </button>
        </div>
      ) : (
        <div className="relative flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            href="/"
            onClick={handleCloseMobile}
            className="flex items-center justify-center overflow-hidden transition-opacity hover:opacity-90"
          >
            <Logo size={28} />
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title="Collapse Sidebar (Ctrl+\)"
            aria-label="Collapse Sidebar"
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/90 bg-slate-900/80 text-slate-400 hover:border-brand-500/50 hover:bg-brand-600 hover:text-white transition-all shadow-xs group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            onClick={handleCloseMobile}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Scrollable Area */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-2.5 custom-scrollbar ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}
      >
        {/* 1. Dashboard Root Link */}
        <NavItem
          href={NAVIGATION_CONFIG.dashboard.href}
          label={
            NAVIGATION_CONFIG.dashboard.labelKey.startsWith('nav.')
              ? t(NAVIGATION_CONFIG.dashboard.labelKey)
              : NAVIGATION_CONFIG.dashboard.defaultLabel
          }
          icon={NAVIGATION_CONFIG.dashboard.icon}
          collapsed={isCollapsed}
          active={pathname === '/'}
          onClick={handleCloseMobile}
        />

        {/* 2. Collapsed View: 1 Representative Icon per Module */}
        {isCollapsed &&
          filteredGroups.map((group) => {
            const isGroupActive = group.items.some((item) => isNavActive(pathname, item.href));
            const primaryItem = group.items[0];
            const groupTitle = group.titleKey.startsWith('nav.')
              ? t(group.titleKey)
              : group.defaultTitle;

            return (
              <NavItem
                key={group.id}
                href={primaryItem.href}
                label={groupTitle}
                icon={group.icon || primaryItem.icon}
                collapsed={true}
                active={isGroupActive}
                onClick={handleCloseMobile}
              />
            );
          })}

        {/* 3. Expanded View: Full Group Sections with Sub-items */}
        {!isCollapsed &&
          filteredGroups.map((group) => {
            const isOpen = !collapsedSections.includes(group.id);
            const groupTitle = group.titleKey.startsWith('nav.')
              ? t(group.titleKey)
              : group.defaultTitle;

            return (
              <NavSection
                key={group.id}
                title={groupTitle}
                icon={group.icon}
                open={isOpen}
                collapsed={false}
                onToggle={() => toggleSection(group.id)}
              >
                {group.items.map((item) => {
                  const itemLabel = item.labelKey.startsWith('nav.')
                    ? t(item.labelKey)
                    : item.defaultLabel;

                  return (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={itemLabel}
                      icon={item.icon}
                      badge={item.badge}
                      collapsed={false}
                      onClick={handleCloseMobile}
                    />
                  );
                })}
              </NavSection>
            );
          })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex h-full shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={handleCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex w-72 max-w-xs flex-1 flex-col shadow-2xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
