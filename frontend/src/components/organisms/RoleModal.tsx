'use client';
// src/components/organisms/RoleModal.tsx — Granular RBAC Role & Permission Matrix Manager.
import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PERMISSION_GROUPS, ALL_UI_PERMISSIONS } from '@/lib/permissions';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ShieldCheck, ShieldAlert, Lock, Search, CheckSquare, Square, XCircle } from 'lucide-react';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export function RoleModal({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { can } = useAuth();
  const { t } = useI18n();
  const isNew = role === null;
  const isAdminRole = role?.name === 'ADMIN';

  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [perms, setPerms] = useState<string[]>(
    isAdminRole ? ALL_UI_PERMISSIONS : (role?.permissions ?? []),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (p: string) => {
    if (isAdminRole) return;
    setPerms((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  };

  const toggleGroup = (groupPerms: string[]) => {
    if (isAdminRole) return;
    const allOn = groupPerms.every((p) => perms.includes(p));
    setPerms((s) =>
      allOn
        ? s.filter((p) => !groupPerms.includes(p))
        : [...new Set([...s, ...groupPerms])],
    );
  };

  const selectAll = () => {
    if (isAdminRole) return;
    setPerms(ALL_UI_PERMISSIONS);
  };

  const deselectAll = () => {
    if (isAdminRole) return;
    setPerms([]);
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_GROUPS;
    const q = searchQuery.toLowerCase().trim();
    return PERMISSION_GROUPS.map((g) => {
      const matchingPerms = g.perms.filter(
        (p) => p.toLowerCase().includes(q) || g.group.toLowerCase().includes(q),
      );
      return { ...g, perms: matchingPerms };
    }).filter((g) => g.perms.length > 0);
  }, [searchQuery]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/roles', {
          name: name.trim().toUpperCase(),
          description: description.trim() || undefined,
          permissions: perms,
        });
      } else {
        await api.patch(`/roles/${role.id}`, {
          description: description.trim() || undefined,
        });
        if (!isAdminRole) {
          await api.patch(`/roles/${role.id}/permissions`, { permissions: perms });
        }
      }
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to save role.';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!role || isAdminRole) return;
    if (!confirm(`Are you sure you want to permanently delete the role "${role.name}"?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/roles/${role.id}`);
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete role.';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Create New Role' : `Edit Role: ${role.name}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Role Identity Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="r-name"
            label="Role Code / Identifier *"
            placeholder="e.g. OPERATIONS_LEAD"
            value={name}
            disabled={!isNew}
            onChange={(e) => setName(e.target.value.toUpperCase())}
          />
          <FormField
            id="r-desc"
            label="Role Description"
            placeholder="Describe role responsibilities & scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Admin Lock Warning */}
        {isAdminRole && (
          <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-700 dark:text-indigo-300">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Protected Super Admin Role</p>
              <p className="text-[11px] opacity-90">
                Full administrative access is permanently enabled for the ADMIN role to prevent system lockout.
              </p>
            </div>
          </div>
        )}

        {/* Permission Matrix Controls */}
        <div className="border-t border-slate-100 pt-3 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Granular Permissions Matrix
              </p>
              <Badge tone="indigo" dot>
                {isAdminRole ? 'All Enabled' : `${perms.length} Selected`}
              </Badge>
            </div>

            {!isAdminRole && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions by keyword (e.g. deals, invoice, whatsapp)..."
              className="h-8 w-full rounded-xl border border-slate-200/80 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
            />
          </div>

          {/* Matrix Container */}
          <div className="max-h-72 space-y-4 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
            {filteredGroups.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No permissions matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              filteredGroups.map((g) => {
                const groupPerms = g.perms;
                const isAllSelected = groupPerms.length > 0 && groupPerms.every((p) => perms.includes(p));

                return (
                  <div key={g.group} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-1 dark:border-slate-800/50">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {g.group}
                      </span>
                      {!isAdminRole && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupPerms)}
                          className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {isAllSelected ? 'Deselect Group' : 'Select Group'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {groupPerms.map((p) => {
                        const checked = isAdminRole || perms.includes(p);
                        return (
                          <label
                            key={p}
                            className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border p-2 text-xs transition ${
                              checked
                                ? 'border-brand-500/30 bg-brand-50/40 text-slate-900 dark:bg-brand-500/10 dark:text-white'
                                : 'border-slate-200/70 bg-white/80 text-slate-600 hover:border-slate-300 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isAdminRole}
                              onChange={() => toggle(p)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <span className="font-mono text-[11px] truncate">{p}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Button
              disabled={busy || (isNew && !name.trim())}
              loading={busy}
              onClick={save}
              className="bg-brand-600 font-bold text-white hover:bg-brand-500"
            >
              Save Changes
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {!isNew && !isAdminRole && can('role.delete') && (
            <Button variant="danger" disabled={busy} loading={busy} onClick={del}>
              Delete Role
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
