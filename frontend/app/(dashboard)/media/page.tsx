'use client';
// app/(dashboard)/media/page.tsx — Media Library & Digital Asset Manager
import React, { useState } from 'react';
import NextImage from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Plus,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Copy,
  Trash2,
  Check,
  ExternalLink,
  Search,
  X,
  File,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folder?: string;
  tags?: string[];
  createdAt: string;
}

export default function MediaLibraryPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    originalName: '',
    url: '',
    folder: 'documents',
    tags: 'sales, proposal',
  });

  const files = useQuery({
    queryKey: ['media-files', selectedFolder],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedFolder !== 'ALL') params.folder = selectedFolder;
      const res = await api.get('/media', { params });
      return unwrap<MediaFile[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['media-files'] });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.originalName.trim() || !uploadForm.url.trim()) return;
    setSubmitting(true);
    try {
      const isImg = uploadForm.url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null;
      await api.post('/media', {
        originalName: uploadForm.originalName,
        filename: uploadForm.originalName.toLowerCase().replace(/\s+/g, '_'),
        url: uploadForm.url,
        mimeType: isImg ? 'image/png' : 'application/pdf',
        size: 1540000,
        folder: uploadForm.folder,
        tags: uploadForm.tags.split(',').map((t) => t.trim()),
      });
      invalidate();
      setUploading(false);
      setUploadForm({ originalName: '', url: '', folder: 'documents', tags: '' });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to register media asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset from library?')) return;
    try {
      await api.delete(`/media/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete file');
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filtered = (files.data || []).filter((f) =>
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardTemplate
      title="Media Library"
      subtitle="Centralized digital asset vault for brochures, proposal PDFs, brand images, and contract documents"
      actions={
        <Button
          onClick={() => setUploading(true)}
          leftIcon={<UploadCloud className="h-4 w-4" />}
          tone="primary"
        >
          Upload Asset
        </Button>
      }
    >
      {/* Folder Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'documents', 'images', 'templates'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                selectedFolder === f
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search file name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {files.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((file) => {
            const isImage = file.mimeType.startsWith('image/') || file.url.match(/\.(jpeg|jpg|gif|png|webp)/i);

            return (
              <Card
                key={file.id}
                className="group flex flex-col justify-between overflow-hidden border-slate-800/80 bg-slate-900/60 p-0 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-36 w-full bg-slate-950 flex items-center justify-center border-b border-slate-800/80 overflow-hidden">
                  {isImage ? (
                    <NextImage
                      src={file.url}
                      alt={file.originalName}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      <FileText className="h-10 w-10 text-indigo-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">
                        {file.originalName.split('.').pop()}
                      </span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 backdrop-blur-md">
                    {formatSize(file.size)}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-xs truncate" title={file.originalName}>
                      {file.originalName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Folder: <span className="text-slate-300 uppercase">{file.folder || 'General'}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <button
                      onClick={() => copyUrl(file.id, file.url)}
                      className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedId === file.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Link Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Open Resource"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <FolderOpen className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">No media assets found</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Upload images, pitch decks, PDFs, or contracts to reference across CRM records.
              </p>
              <Button
                className="mt-4"
                tone="primary"
                onClick={() => setUploading(true)}
                leftIcon={<UploadCloud className="h-4 w-4" />}
              >
                Upload New Asset
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Upload Media Asset</h2>
              <button onClick={() => setUploading(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Enterprise Architecture Whitepaper.pdf"
                  value={uploadForm.originalName}
                  onChange={(e) => setUploadForm({ ...uploadForm, originalName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Public Resource / CDN URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Folder Category</label>
                  <select
                    value={uploadForm.folder}
                    onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="documents">Documents (PDF/Doc)</option>
                    <option value="images">Images & Banners</option>
                    <option value="templates">Templates</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="sales, 2026"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" tone="secondary" onClick={() => setUploading(false)}>
                  Cancel
                </Button>
                <Button type="submit" tone="primary" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Add to Library'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
