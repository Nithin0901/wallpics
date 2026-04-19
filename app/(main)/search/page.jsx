'use client';
/**
 * app/(main)/search/page.jsx
 * Search page — query input, category filter, results grid.
 */
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import WallpaperCard from '@/components/ui/WallpaperCard';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

import { useCategories } from '@/lib/useCategories';

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [mainCategory, setMainCategory] = useState(searchParams.get('mainCategory') || '');
  const [subCategory, setSubCategory] = useState(searchParams.get('subCategory') || '');
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [likedIds, setLikedIds] = useState(new Set());
  const { isAuthenticated } = useAuth();
  
  const { categories: dynamicCategories } = useCategories();
  const MAIN_CATEGORIES = ['', ...dynamicCategories.filter(c => c.type === 'main').map(c => c.name)];
  const SUB_CATEGORIES = ['', ...dynamicCategories.filter(c => c.type === 'sub').map(c => c.name)];

  const doSearch = useCallback(async (q, main, sub) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (main) params.set('mainCategory', main);
      if (sub) params.set('subCategory', sub);
      params.set('limit', '24');
      const { data } = await apiClient.get(`/wallpapers/search?${params}`);
      setWallpapers(data.wallpapers);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(query, mainCategory, subCategory);
    if (isAuthenticated) {
      apiClient.get('/users/my-likes').then((r) => {
        setLikedIds(new Set(r.data.wallpapers.map((w) => w._id)));
      }).catch(() => {});
    }
  }, []);// eslint-disable-line

  function handleSearch(e) {
    e.preventDefault();
    doSearch(query, mainCategory, subCategory);
  }

  async function handleLike(wallpaperId) {
    if (!isAuthenticated) { toast.error('Sign in to like wallpapers'); return; }
    try {
      const { data } = await apiClient.put(`/wallpapers/${wallpaperId}/like`);
      setLikedIds((prev) => { const next = new Set(prev); data.liked ? next.add(wallpaperId) : next.delete(wallpaperId); return next; });
      setWallpapers((prev) => prev.map((w) => w._id === wallpaperId ? { ...w, likes: data.likes } : w));
    } catch { toast.error('Failed to update like'); }
  }

  return (
    <div className="animate-slide-up max-w-[1400px] mx-auto px-4">
      {/* Cinematic Header */}
      <div className="mb-12 pt-8">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-4 block">
          Global Discovery
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter uppercase italic leading-none mb-4">
          SEARCH <span className="gradient-text">ARCHIVES</span>
        </h1>
        <p className="text-sm text-text-muted font-medium max-w-lg">
          {total > 0 
            ? `Found ${total} curated assets matching your query identity.` 
            : 'Access the world\'s most elite collection of high-end digital discoveries.'}
        </p>
      </div>

      {/* High-End Search Interface */}
      <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-12">
        <div className="relative group flex-1">
          <div className="absolute inset-0 bg-purple-600/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative flex items-center bg-white/[0.03] backdrop-blur-xl border border-white/5 focus-within:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-500">
            <Search size={18} className="ml-5 text-text-muted group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="Search aesthetics, mood, resolution..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent px-5 py-4 text-sm md:text-base font-medium text-white placeholder:text-white/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative group">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select
              value={mainCategory}
              onChange={(e) => { setMainCategory(e.target.value); doSearch(query, e.target.value, subCategory); }}
              className="bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-10 py-4 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all appearance-none cursor-pointer focus:outline-none focus:border-purple-500/40"
            >
              {MAIN_CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#050508' }}>
                  {c || 'All Orientations'}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-primary px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em]">
            Execute Search
          </button>
        </div>
      </form>

      {/* Premium Category Navigation */}
      <div className="flex flex-wrap gap-2 mb-12 border-b border-white/5 pb-8">
        {SUB_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setSubCategory(c); doSearch(query, mainCategory, c); }}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subCategory === c
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-white/5 text-text-muted border border-white/5 hover:bg-white/10 hover:text-text-primary'
            }`}
          >
            {c || 'General Discovery'}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : wallpapers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-text-secondary">No results found</p>
          <p className="text-sm text-text-muted mt-1">Try a different search term or category</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-4">
          {wallpapers.map((w) => (
            <WallpaperCard
              key={w._id}
              wallpaper={w}
              liked={likedIds.has(w._id)}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
