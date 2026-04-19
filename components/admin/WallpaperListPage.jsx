'use client';
/**
 * Shared admin wallpaper list page — used for approved AND rejected.
 */
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Search, Trash2, Star } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

import { useCategories } from '@/lib/useCategories';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function WallpaperListPage({ status = 'approved' }) {
  const { categories: dynamicCategories } = useCategories();
  const CATEGORIES = ['', ...dynamicCategories.map(c => c.name)];
  
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page, limit: 12 });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const { data } = await apiClient.get(`/admin/wallpapers?${params}`);
      setWallpapers(data.wallpapers);
      setTotalPages(data.pagination.totalPages || 1);
    } catch { toast.error('Failed to load wallpapers'); }
    finally { setLoading(false); }
  }, [status, page, search, category]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete(id) {
    if (!confirm('Delete this wallpaper permanently?')) return;
    try {
      await apiClient.delete(`/wallpapers/${id}`);
      setWallpapers((p) => p.filter((w) => w._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  }

  async function handleReApprove(id) {
    try {
      await apiClient.put(`/wallpapers/${id}/status`, { status: 'approved' });
      setWallpapers((p) => p.filter((w) => w._id !== id));
      toast.success('Wallpaper re-approved!');
    } catch { toast.error('Failed'); }
  }

  async function handlePlanUpdate(id, planRequired) {
    try {
      await apiClient.put(`/admin/wallpapers/${id}/plan`, { planRequired });
      setWallpapers((p) => p.map((w) => w._id === id ? { ...w, planRequired } : w));
      toast.success(`Access updated to ${planRequired.toUpperCase()}`);
    } catch { toast.error('Failed to update access'); }
  }

  async function handleFeatureToggle(id, isFeatured) {
    try {
      const newStatus = !isFeatured;
      await apiClient.patch(`/admin/wallpapers/${id}/feature`, { isFeatured: newStatus });
      setWallpapers((p) => p.map((w) => w._id === id ? { ...w, isFeatured: newStatus } : w));
      toast.success(newStatus ? '⭐ Wallpaper Featured!' : 'Removed from Featured');
    } catch { toast.error('Failed to update featured status'); }
  }

  const isApproved = status === 'approved';

  return (
    <div className="animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
          <CheckCircle size={22} className={isApproved ? 'text-accent-green' : 'text-accent-red'} />
          {isApproved ? 'Approved' : 'Rejected'} Wallpapers
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {isApproved ? 'These wallpapers are live on the platform.' : 'These wallpapers were rejected.'}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input-field py-2.5 text-sm w-40 appearance-none" style={{ background: '#13131f' }}>
          {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: '#13131f' }}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton" style={{ aspectRatio: '16/10' }} />
              <div className="p-3 space-y-2"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
            </div>
          ))}
        </div>
      ) : wallpapers.length === 0 ? (
        <div className="card p-16 text-center text-text-muted">No {status} wallpapers found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {wallpapers.map((w) => (
              <div key={w._id} className="card overflow-hidden group">
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
                  <img src={w.image} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/250'; }} />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'rgba(10,10,15,0.8)' }}>{w.category}</span>
                  </div>
                  {/* Action overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleFeatureToggle(w._id, w.isFeatured)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        w.isFeatured 
                          ? 'bg-amber-500 text-white border-amber-400' 
                          : 'bg-black/60 text-white/70 border-white/10 hover:text-white hover:bg-black/80'
                      }`}
                    >
                      <Star size={13} fill={w.isFeatured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDelete(w._id)}
                      className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white border border-red-400/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">{w.title}</h3>
                    {w.isFeatured && (
                      <span className="flex-shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">by {w.uploadedBy?.username} · {timeAgo(w.createdAt)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                    <span>❤ {formatCount(w.likes)}</span>
                    <span>⬇ {formatCount(w.downloads)}</span>
                    <span>👁 {formatCount(w.views)}</span>
                  </div>

                  {/* Access Level Selector */}
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase">ACCESS</span>
                    <select
                      value={w.planRequired || 'free'}
                      onChange={(e) => handlePlanUpdate(w._id, e.target.value)}
                      className="text-[10px] py-1 px-2 rounded-lg border appearance-none lowercase font-bold"
                      style={{ background: '#13131f', color: '#94a3b8', border: '1px solid rgba(124,58,237,0.2)' }}
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>

                  {!isApproved && (
                    <button onClick={() => handleReApprove(w._id)} className="btn-approve w-full justify-center mt-3 py-2 text-xs">
                      ✓ Re-approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline py-2 px-3 text-sm disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`py-2 px-3.5 rounded-lg text-sm font-semibold ${p === page ? 'bg-purple-primary text-white' : 'bg-bg-card text-text-secondary border border-[rgba(124,58,237,0.2)]'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline py-2 px-3 text-sm disabled:opacity-40">›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
