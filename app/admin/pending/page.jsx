'use client';
/**
 * app/admin/pending/page.jsx — Admin pending wallpapers grid with filters.
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Clock } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

import { useCategories } from '@/lib/useCategories';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function PendingWallpapersPage() {
  const { categories: dynamicCategories } = useCategories();
  const CATEGORIES = ['', ...dynamicCategories.map(c => c.name)];
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, sort });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const { data } = await apiClient.get(`/wallpapers/pending?${params}`);
      setWallpapers(data.wallpapers);
      setTotalPages(data.pagination.totalPages || 1);
    } catch { toast.error('Failed to load pending wallpapers'); }
    finally { setLoading(false); }
  }, [page, search, category, sort]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function updateStatus(id, status) {
    try {
      await apiClient.put(`/wallpapers/${id}/status`, { status });
      setWallpapers((prev) => prev.filter((w) => w._id !== id));
      toast.success(`Wallpaper ${status}!`);
    } catch { toast.error('Failed to update status'); }
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Pending Wallpapers</h1>
          <p className="text-text-muted text-sm mt-1">Review and moderate uploaded wallpapers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search wallpapers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input-field py-2.5 text-sm w-40 appearance-none" style={{ background: '#13131f' }}>
          {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: '#13131f' }}>{c || 'All Categories'}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field py-2.5 text-sm w-40 appearance-none" style={{ background: '#13131f' }}>
          <option value="newest" style={{ background: '#13131f' }}>Newest First</option>
          <option value="oldest" style={{ background: '#13131f' }}>Oldest First</option>
        </select>
        <button className="p-2.5 rounded-lg bg-bg-card border border-[rgba(124,58,237,0.2)] text-text-secondary hover:text-text-primary">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton" style={{ aspectRatio: '4/3' }} />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="flex gap-2 mt-3">
                  <div className="skeleton h-8 flex-1 rounded" />
                  <div className="skeleton h-8 flex-1 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : wallpapers.length === 0 ? (
        <div className="card p-20 text-center">
          <Clock size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">No pending wallpapers</p>
          <p className="text-sm text-text-muted">All caught up! 🎉</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {wallpapers.map((w) => (
              <div key={w._id} className="card overflow-hidden group">
                <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <img src={w.image} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/300'; }} />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: 'rgba(10,10,15,0.8)' }}>{w.category}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-text-primary truncate mb-0.5">{w.title}</h3>
                  <p className="text-xs text-text-muted mb-0.5">by {w.uploadedBy?.username}</p>
                  <p className="text-[11px] text-text-muted mb-3">{timeAgo(w.createdAt)}</p>
                  
                  {/* Discovery Tags (Admin Preview) */}
                  <div className="flex flex-wrap gap-1 mb-4 h-9 overflow-hidden">
                    {(w.tags || []).length > 0 ? (
                      w.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase text-white/40 tracking-tighter">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-bold text-text-muted uppercase italic tracking-widest opacity-50">No Tags</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(w._id, 'approved')} className="btn-approve flex-1 justify-center py-2 text-xs">
                      ✓ Approve
                    </button>
                    <button onClick={() => updateStatus(w._id, 'rejected')} className="btn-reject flex-1 justify-center py-2 text-xs">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline py-2 px-3 text-sm disabled:opacity-40">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`py-2 px-3.5 rounded-lg text-sm font-semibold transition-all ${p === page ? 'bg-purple-primary text-white' : 'bg-bg-card text-text-secondary border border-[rgba(124,58,237,0.2)] hover:text-text-primary'}`}
                >{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline py-2 px-3 text-sm disabled:opacity-40">›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
