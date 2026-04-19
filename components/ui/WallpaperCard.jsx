'use client';
/**
 * components/ui/WallpaperCard.jsx
 * Wallpaper card component — image, title, category, uploader, stat counters.
 * Used on homepage, search, and profile pages.
 */
import Link from 'next/link';
import { Heart, Download, Eye, Sparkles } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function WallpaperCard({ wallpaper, onLike, liked = false, showStatus = false, onDelete, onEdit }) {
  // Guard: return nothing if wallpaper ref is broken/deleted
  if (!wallpaper) return null;

  const {
    _id, title, image, category, uploadedBy,
    likes = 0, downloads = 0, views = 0, status,
    planRequired = 'free', isFeatured = false
  } = wallpaper;

  return (
    <div className="relative group break-inside-avoid mb-6">
      <Link
        href={`/wallpaper/${_id}`}
        className="wallpaper-card block bg-bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:border-purple-primary/30 hover:shadow-xl hover:shadow-purple-900/10"
      >
        {/* Image Container with Smart Fit */}
        <div 
          className="relative overflow-hidden bg-bg-secondary" 
          style={{ 
            aspectRatio: wallpaper.mainCategory === 'Portrait' ? '10/14' : '16/9' 
          }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transform duration-700 group-hover:scale-[1.05]"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/800/500'; }}
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Actions */}
          <div className="absolute top-3 left-3 flex gap-2 items-center">
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-bg-secondary/60 backdrop-blur-md border border-border text-text-primary uppercase tracking-tighter">
              {category}
            </span>
            {isFeatured && (
               <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-500/20 text-amber-500 uppercase tracking-tighter shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                 ⭐ Featured
               </span>
            )}
            {showStatus && status && (
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter badge-${status} backdrop-blur-md border border-border`}>
                {status}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <PremiumBadge tier={planRequired} />
            {onLike && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike(_id); }}
                className="p-2 rounded-xl bg-bg-secondary/60 backdrop-blur-md border border-border text-text-primary hover:text-rose-500 transition-colors"
                title="Favorite"
              >
                <Heart size={16} className={liked ? 'fill-current text-rose-500' : ''} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(wallpaper); }}
                className="p-2 rounded-xl bg-bg-secondary/60 backdrop-blur-md border border-border text-text-primary hover:text-purple-primary transition-colors"
                title="Refine Specifications"
              >
                <Sparkles size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(_id); }}
                className="p-2 rounded-xl bg-bg-secondary/60 backdrop-blur-md border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                title="Remove Permanently"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            )}
          </div>

          {/* Stats Bar (Bottom) */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
             <div className="flex gap-3">
               <div className="flex items-center gap-1.5 text-text-primary text-[10px] font-black drop-shadow-md">
                 <Heart size={12} className="text-rose-500" />
                 {formatCount(likes)}
               </div>
               <div className="flex items-center gap-1.5 text-text-primary text-[10px] font-black drop-shadow-md">
                 <Download size={12} className="text-blue-500" />
                 {formatCount(downloads)}
               </div>
             </div>
             <div className="text-text-primary opacity-70 text-[10px] font-black drop-shadow-md">
               {formatCount(views)} VIEWS
             </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-3">
          <h3 className="text-[13px] font-black text-text-primary truncate mb-1 uppercase italic tracking-tighter transition-colors group-hover:text-purple-400">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-lg shadow-purple-900/40">
              {uploadedBy?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-[10px] font-bold text-text-muted truncate uppercase tracking-widest">
              {uploadedBy?.username || 'Unknown Curator'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
