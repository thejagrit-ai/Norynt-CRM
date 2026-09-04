// src/lib/dashboard-layout.ts
//
// Decides WHICH dashboard blocks exist and HOW they are arranged, given the
// current account's capabilities. Kept separate from the page so the rule that
// matters — "the layout must look deliberate for every role, not just ADMIN" —
// is a pure function that can be asserted directly.
//
// The invariants this must uphold:
//   * the KPI grid's column count never exceeds its cell count, so no account
//     ever sees orphaned empty cells in the strip;
//   * the two-column split is only used when BOTH columns have content, so no
//     account ever sees a dead column.

export type DashboardCaps = {
  sales: boolean;
  financial: boolean;
  tasks: boolean;
  tickets: boolean;
  ai: boolean;
};

export type KpiId = 'pipeline' | 'forecast' | 'winrate' | 'unpaid' | 'billed';
export type PanelId = 'performance' | 'deals' | 'tickets' | 'attention' | 'tasks' | 'ai';

export type DashboardPlan = {
  kpis: KpiId[];
  /** Tailwind column classes matching kpis.length exactly. */
  kpiCols: string;
  left: PanelId[];
  right: PanelId[];
  /** True when the 8/4 split is used; false means a single full-width flow. */
  split: boolean;
  /** Panels in render order when `split` is false. */
  solo: PanelId[];
  /** Grid classes for the non-split flow. */
  soloCols: string;
};

/** Column classes keyed by cell count. Static strings so Tailwind can see them. */
const KPI_COLS: Record<number, string> = {
  0: 'grid-cols-1',
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
};

export function planDashboard(c: DashboardCaps): DashboardPlan {
  const kpis: KpiId[] = [];
  if (c.sales) kpis.push('pipeline', 'forecast', 'winrate');
  if (c.financial) {
    kpis.push('unpaid');
    // A finance-only account would otherwise have a single cell stretched
    // across the whole row. Promoting the billed total to its own tile fixes
    // that; adding it unconditionally would make five cells in a four-column
    // grid, which is the orphan case we are avoiding.
    if (!c.sales) kpis.push('billed');
  }

  const left: PanelId[] = [];
  // "Performance" exists when there is at least one chart to put in it, and the
  // two charts are gated independently so a finance-only account keeps its own.
  if (c.sales || c.financial) left.push('performance');
  if (c.sales) left.push('deals');
  // Tickets sit in the primary column so a support-only account still has one.
  if (c.tickets) left.push('tickets');

  const right: PanelId[] = [];
  if (c.ai) right.push('attention');
  if (c.tasks) right.push('tasks');
  if (c.ai) right.push('ai');

  const split = left.length > 0 && right.length > 0;
  const solo = split ? [] : [...left, ...right];

  return {
    kpis,
    kpiCols: KPI_COLS[Math.min(kpis.length, 4)],
    left,
    right,
    split,
    solo,
    soloCols: solo.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
  };
}
