'use client';
// app/(dashboard)/tasks/page.tsx — World-class Task & Activity Workspace with i18n & 3D Cards.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Kanban as KanbanIcon,
  List,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Task, Paginated } from '@/types';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

export default function TasksPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filterStatus],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await api.get('/tasks', { params });
      return unwrap<Paginated<Task>>(res.data);
    },
  });

  const createTask = useMutation({
    mutationFn: (v: any) => api.post('/tasks', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setQuickTitle('');
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.patch(`/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.data ?? [];

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    createTask.mutate({ title: quickTitle, priority: quickPriority, status: 'TODO' });
  };

  const toggleStatus = (task: Task) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    updateTask.mutate({ id: task.id, data: { status: nextStatus } });
  };

  // KPI calculations
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length;

  return (
    <DashboardTemplate
      title={t('page.tasks')}
      headerAction={
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{t('tasks.listView')}</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              <span>{t('tasks.kanbanView')}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('tasks.total')}</p>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{t('tasks.completed')}</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{t('tasks.inProgress')}</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{inProgressCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">{t('tasks.overdue')}</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-black/20"
      >
        <CheckSquare className="h-5 w-5 text-brand-400 shrink-0 ml-2" />
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={t('tasks.quickAddPlaceholder')}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
        />
        <select
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value as any)}
          className="rounded-xl border border-slate-700/60 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-300 outline-none"
        >
          <option value="LOW">{t('tasks.priorityLow')}</option>
          <option value="MEDIUM">{t('tasks.priorityMedium')}</option>
          <option value="HIGH">{t('tasks.priorityHigh')}</option>
          <option value="URGENT">{t('tasks.priorityUrgent')}</option>
        </select>
        <Button size="sm" type="submit" loading={createTask.isPending}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.add')}</span>
        </Button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: t('tasks.tabAll') },
          { key: 'TODO', label: t('tasks.tabTodo') },
          { key: 'IN_PROGRESS', label: t('tasks.tabInProgress') },
          { key: 'DONE', label: t('tasks.tabDone') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === tab.key
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List / Kanban Content */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20">
          <CheckSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">{t('tasks.empty')}</h3>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isOverdue =
              task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition group ${
                  task.status === 'DONE'
                    ? 'border-slate-800/40 bg-slate-900/30 opacity-60'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleStatus(task)}
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      task.status === 'DONE'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {task.status === 'DONE' && <CheckCircle2 className="h-4 w-4" />}
                  </button>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm font-semibold truncate ${
                        task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-400">
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-rose-400 font-bold' : ''
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && ` (${t('tasks.overdueBadge')})`}
                        </span>
                      )}
                      {task.deal && (
                        <span className="truncate text-slate-500">
                          {t('qc.deal')}: {task.deal.title}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="text-slate-500">
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Badge
                    tone={
                      task.priority === 'URGENT'
                        ? 'red'
                        : task.priority === 'HIGH'
                          ? 'amber'
                          : task.priority === 'LOW'
                            ? 'gray'
                            : 'blue'
                    }
                  >
                    {task.priority}
                  </Badge>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            const titles: Record<string, string> = {
              TODO: t('tasks.tabTodo'),
              IN_PROGRESS: t('tasks.tabInProgress'),
              DONE: t('tasks.tabDone'),
            };
            return (
              <div key={col} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {titles[col]}
                  </span>
                  <Badge tone="gray">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2.5 min-h-[200px]">
                  {colTasks.map((tItem) => (
                    <div
                      key={tItem.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition space-y-2"
                    >
                      <p className="text-xs font-semibold text-white leading-snug">{tItem.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <Badge
                          tone={
                            tItem.priority === 'URGENT'
                              ? 'red'
                              : tItem.priority === 'HIGH'
                                ? 'amber'
                                : 'gray'
                          }
                        >
                          {tItem.priority}
                        </Badge>
                        {tItem.dueDate && (
                          <span>{new Date(tItem.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </DashboardTemplate>
  );
}
