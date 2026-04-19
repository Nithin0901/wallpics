'use client';
/**
 * components/home/TrendingSection.jsx
 * Horizontal scrollable row of trending wallpapers.
 * Shows: image, like count, download count at bottom.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Heart, Download } from 'lucide-react';
import apiClient from '@/lib/apiClient';

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function TrendingCardSkeleton() {
  return (
    <div className="skeleton rounded-xl flex-shrink-0" style={{ width: '220px', aspectRatio: '3/4' }} />
  );
}

export default function TrendingSection() {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/wallpapers?sort=trending&limit=8')
      .then((r) => setWallpapers(r.data.wallpapers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mb-8">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Flame size={20} className="text-orange-400" />
            Trending Wallpapers
          </h2>
          <p className="section-sub">Most popular wallpapers this week</p>
        </div>
        <Link
          href="/?sort=trending"
          className="text-xs font-semibold text-purple-primary hover:text-purple-600 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <TrendingCardSkeleton key={i} />)
          : wallpapers.map((w) => (
              <Link
                key={w._id}
                href={`/wallpaper/${w._id}`}
                className="group relative rounded-2xl overflow-hidden flex-shrink-0 hover:shadow-xl hover:shadow-purple-900/20 transition-all hover:-translate-y-1 border border-border"
                style={{ width: '220px', aspectRatio: '3/4' }}
              >
                <img
                  src={w.image}
                  alt={w.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/300/400'; }}
                />
                {/* Bottom gradient overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
                />
                {/* Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
                  <div className="flex items-center gap-1.5 text-text-primary text-[10px] font-black drop-shadow-md transition-transform group-hover:scale-110">
                    <Heart size={12} className="text-rose-500 fill-rose-500/20" />
                    {formatCount(w.likes)}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-primary text-[10px] font-black drop-shadow-md transition-transform group-hover:scale-110">
                    <Download size={12} className="text-blue-500" />
                    {formatCount(w.downloads)}
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
