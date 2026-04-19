'use client';
/**
 * components/home/FeaturedSection.jsx
 * Premium horizontal carousel for featured content.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Heart, Download } from 'lucide-react';
import apiClient from '@/lib/apiClient';

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function FeaturedSection() {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/wallpapers?featured=true&limit=6')
      .then((r) => setWallpapers(r.data.wallpapers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && wallpapers.length === 0) return null;

  return (
    <section className="mb-14 overflow-hidden">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Star size={20} className="text-amber-400 fill-amber-400/20" />
            Featured Content
          </h2>
          <p className="section-sub">Hand-picked curations for elite desktop aesthetics</p>
        </div>
        <Link
          href="/search?q=featured"
          className="text-xs font-black uppercase tracking-[0.2em] text-purple-primary hover:text-purple-600 flex items-center gap-1.5 transition-all group"
        >
          Explore Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 pt-4 scrollbar-hide -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton rounded-[2rem] flex-shrink-0" style={{ width: '400px', height: '260px' }} />
            ))
          : wallpapers.map((w) => (
              <Link
                key={w._id}
                href={`/wallpaper/${w._id}`}
                className="group relative rounded-[2rem] overflow-hidden flex-shrink-0 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-2 border border-white/5"
                style={{ width: '400px', height: '260px' }}
              >
                <img
                  src={w.image}
                  alt={w.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  onError={(e) => { e.target.src = 'https://picsum.photos/seed/featured/800/600'; }}
                />
                
                {/* Immersive Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/40 to-transparent" />

                {/* Content HUD */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end transform transition-transform group-hover:translate-y-[-4px]">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20 mb-3 drop-shadow-lg">
                      Curated Masterpiece
                    </span>
                    <h3 className="text-xl lg:text-2xl font-black text-text-primary uppercase italic tracking-tighter truncate drop-shadow-xl group-hover:text-purple-400 transition-colors">
                      {w.title}
                    </h3>
                    <p className="text-[10px] font-medium text-text-muted mt-1 uppercase tracking-widest">
                      Curated by {w.uploadedBy?.username || 'Elite Personnel'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-text-primary text-xs font-black drop-shadow-md">
                      <Heart size={14} className="text-rose-500 fill-rose-500/20" />
                      {formatCount(w.likes)}
                    </div>
                  </div>
                </div>

                {/* Glass Glare Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
              </Link>
            ))}
      </div>
    </section>
  );
}
