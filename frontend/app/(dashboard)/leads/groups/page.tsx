'use client';
// app/(dashboard)/leads/groups/page.tsx — Lead Groups Management
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2, Edit2, UserPlus, FolderKanban, Shield, X, Check } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/molecules/Modal';
import { createPortal } from 'react-dom';

interface LeadGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  _count?: { members: number };
  members?: Array<{ lead: { id: string; firstName: string; lastName: string; email?: string; companyName?: string } }>;
}

export default function LeadGroupsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LeadGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
  const [submitting, setSubmitting] = useState(false);

  const groups = useQuery({
    queryKey: ['lead-groups'],
    queryFn: async () => {
      const res = await api.get('/lead-groups');
      return unwrap<LeadGroup[]>(res.data);
    },
  });

  const allLeads = useQuery({
    queryKey: ['leads-all'],
    queryFn: async () => {
      const res = await api.get('/leads', { params: { limit: 100 } });
      return unwrap<any[]>(res.data);
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['lead-groups'] });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingGroup) {
        await api.patch(`/lead-groups/${editingGroup.id}`, formData);
      } else {
        await api.post('/lead-groups', formData);
      }
      invalidate();
      setCreating(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '', color: '#3b82f6' });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save lead group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead group?')) return;
    try {
      await api.delete(`/lead-groups/${id}`);
      invalidate();
      if (selectedGroup?.id === id) setSelectedGroup(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete lead group');
    }
  };

  const handleAddMember = async (groupId: string, leadId: string) => {
    try {
      await api.post(`/lead-groups/${groupId}/members`, { leadIds: [leadId] });
      invalidate();
      // refresh selected group
      const res = await api.get(`/lead-groups/${groupId}`);
      setSelectedGroup(unwrap<LeadGroup>(res.data));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (groupId: string, leadId: string) => {
    try {
      await api.delete(`/lead-groups/${groupId}/members/${leadId}`);
      invalidate();
      const res = await api.get(`/lead-groups/${groupId}`);
      setSelectedGroup(unwrap<LeadGroup>(res.data));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  const openEdit = (group: LeadGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3b82f6',
    });
    setCreating(true);
  };

  const viewDetails = async (group: LeadGroup) => {
    try {
      const res = await api.get(`/lead-groups/${group.id}`);
      setSelectedGroup(unwrap<LeadGroup>(res.data));
    } catch {
      setSelectedGroup(group);
    }
  };

  return (
    <DashboardTemplate
      title="Lead Groups"
      subtitle="Organize, batch, and segment incoming sales leads into targeted groups"
      actions={
        <Button
          onClick={() => {
            setEditingGroup(null);
            setFormData({ name: '', description: '', color: '#3b82f6' });
            setCreating(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          Create Lead Group
        </Button>
      }
    >
      {groups.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(groups.data || []).map((group) => (
            <Card
              key={group.id}
              className="group relative flex flex-col justify-between overflow-hidden border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ backgroundColor: group.color || '#3b82f6' }}
              />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: group.color || '#3b82f6' }}
                    />
                    <h3 className="font-semibold text-white text-base">{group.name}</h3>
                  </div>
                  <Badge tone="blue">
                    <Users className="mr-1 h-3 w-3 inline" />
                    {group._count?.members || 0} Leads
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {group.description || 'No description provided for this group.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800/60 pt-4">
                <Button
                  size="sm"
                  tone="secondary"
                  onClick={() => viewDetails(group)}
                >
                  Manage Members
                </Button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(group)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {(!groups.data || groups.data.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <FolderKanban className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">No Lead Groups created yet</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Create groups to categorize and assign batches of leads for specialized marketing or sales campaigns.
              </p>
              <Button
                className="mt-4"
                tone="primary"
                onClick={() => setCreating(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Group
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {creating && (
        <Modal
          title={editingGroup ? 'Edit Lead Group' : 'Create New Lead Group'}
          description="Organize leads into targeted groups for marketing and assignment"
          onClose={() => setCreating(false)}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Group Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Enterprise Tech Inbound Q3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Brief context or goals for this cohort..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Badge Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-1"
                />
                <span className="font-mono text-xs text-slate-400">{formData.color}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" tone="primary" disabled={submitting}>
                {submitting ? 'Saving…' : editingGroup ? 'Update Group' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Member Management Drawer */}
      {selectedGroup &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedGroup(null)}
          >
            <div
              className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
                    <h2 className="text-lg font-semibold text-white">{selectedGroup.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedGroup.members?.length || 0} leads currently in this group
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick add lead */}
              <div className="my-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Add Lead to Group
                </h4>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddMember(selectedGroup.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a lead to add…
                  </option>
                  {(allLeads.data || [])
                    .filter(
                      (lead) =>
                        !selectedGroup.members?.some((m) => m.lead.id === lead.id),
                    )
                    .map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName} {lead.companyName ? `(${lead.companyName})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Member list */}
              <div className="flex-1 space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Assigned Leads
                </h4>
                {(selectedGroup.members || []).map(({ lead }) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {lead.email || 'No email'} · {lead.companyName || 'No Company'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(selectedGroup.id, lead.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Remove from group"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    No leads assigned yet. Use the dropdown above to add leads.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </DashboardTemplate>
  );
}
