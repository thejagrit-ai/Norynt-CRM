'use client';
// src/components/organisms/UserEditModal.tsx — user editor with role assignment & active status toggle.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Label } from '../atoms/Label';
import type { User } from '@/types';

interface Role {
  id: string;
  name: string;
}

export function UserEditModal({
  user,
  onClose,
  onChanged,
}: {
  user: User;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { can } = useAuth();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [active, setActive] = useState(user.isActive);
  const [roleNames, setRoleNames] = useState<string[]>(user.roles);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const roles = useQuery({
    queryKey: ['roles'],
    enabled: can('role.read') || can('role.assign'),
    queryFn: async () => unwrap<Role[]>((await api.get('/roles')).data),
  });

  const toggleRole = (name: string) =>
    setRoleNames((s) =>
      s.includes(name) ? s.filter((r) => r !== name) : [...s, name],
    );

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.patch(`/users/${user.id}`, { firstName, lastName });
      if (active !== user.isActive) {
        await api.patch(`/users/${user.id}/status`, { isActive: active });
      }
      if (can('role.assign') && roles.data) {
        const roleIds = roles.data
          .filter((r) => roleNames.includes(r.name))
          .map((r) => r.id);
        await api.patch(`/users/${user.id}/roles`, { roleIds });
      }
      onChanged();
      onClose();
    } catch {
      setErr(t('common.error') || 'Failed to update user.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm(`${t('common.delete') || 'Delete'}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/users/${user.id}`);
      onChanged();
      onClose();
    } catch {
      setErr(t('common.error') || 'Failed to delete user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${t('user.modalPrefix') || 'Edit User'}: ${user.email}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="u-first"
          label={t('field.firstName') || 'First Name'}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <FormField
          id="u-last"
          label={t('field.lastName') || 'Last Name'}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-950/60">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <span>{t('common.active') || 'Active Account'}</span>
          <Badge tone={active ? 'green' : 'gray'} dot>
            {active ? (t('user.activeStatus') || 'Active Account') : (t('user.inactiveStatus') || 'Inactive Account')}
          </Badge>
        </label>
      </div>

      {can('role.assign') && (
        <div className="mt-4 space-y-2">
          <Label>{t('col.roles') || 'Assigned Roles'}</Label>
          <div className="flex flex-wrap gap-2">
            {(roles.data ?? []).map((r) => {
              const selected = roleNames.includes(r.name);
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggleRole(r.name)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? 'border-brand-500/50 bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-500/15 dark:text-brand-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-brand-500' : 'bg-slate-400'}`} />
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button disabled={busy} loading={busy} onClick={save}>
            {t('common.save') || 'Save'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        {can('user.delete') && (
          <Button variant="danger" disabled={busy} loading={busy} onClick={del}>
            {t('common.delete') || 'Delete'}
          </Button>
        )}
      </div>
      {err && <p className="mt-3 text-xs font-medium text-rose-500 dark:text-rose-400">{err}</p>}
    </Modal>
  );
}
