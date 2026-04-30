'use client';
/**
 * components/layout/Sidebar.jsx
 * Left sidebar — navigation + category list + upload CTA.
 * Refactored for mobile (slide-over) and better structural layout.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home, TrendingUp, Clock, LayoutGrid, Star,
  Upload, Leaf, Zap, Car, Globe, Building2,
  Minus, Sparkles, Swords, ChevronRight, X
} from 'lucide-react';
import { useCategories } from '@/lib/useCategories';

const NAV_ITEMS = [
  { label: 'Home',       href: '/',          icon: Home },
  { label: 'Trending',   href: '/?sort=trending', icon: TrendingUp },
  { label: 'Latest',     href: '/?sort=latest',   icon: Clock },
  { label: 'Categories', href: '/search',     icon: LayoutGrid },
  { label: 'Top Rated',  href: '/?sort=popular',  icon: Star },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { categories } = useCategories();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isOpen) onClose?.();
  }, [pathname]);

  return (
    <>
      {/* ── Backdrop (Mobile) ────────────────────────── */}
      <div
        className={`fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* ── Sidebar Container ───────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-[150] h-full w-72 lg:w-64 bg-bg-secondary lg:bg-bg-secondary/80 lg:backdrop-blur-3xl border-r border-border transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ── Header / Logo (Fixed) ─────────────────── */}
        <div className="flex-none flex items-center justify-between gap-3 px-6 py-6 border-b border-border">
          <Link href="/" className="flex items-center  active:scale-95 transition-transform">
            <img
              src="/logo.png"
              alt="AUROVOID Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-2xl shadow-purple-900/60 hover:scale-105 transition-transform duration-300"
            />
            <span className="text-lg font-black text-text-primary italic tracking-tighter uppercase">
              AURO<span className="text-purple-primary">VOID</span>
            </span>
          </Link>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable Content ─────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {/* Main Nav */}
          <div className="px-4 py-4">
            <nav className="space-y-1.5">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link 
                    key={label} 
                    href={href} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                      active 
                        ? 'bg-purple-primary/10 text-purple-primary border border-purple-primary/20 shadow-lg shadow-purple-primary/10' 
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border mx-4" />

          {/* Categories */}
          <div className="px-4 py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-6 px-4">
              Curation Archives
            </p>
            <div className="space-y-1.5">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat._id || cat.name}
                  href={`/search?subCategory=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-2xl group hover:bg-bg-hover transition-all duration-300 border border-transparent hover:border-border"
                >
                  <div className="w-12 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-border shadow-lg group-hover:scale-110 transition-transform">
                    <img
                      src={`https://images.unsplash.com/photo-${cat.seed || '1618005182384-a83a8bd57fbe'}?auto=format&fit=crop&q=80&w=120`}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${cat.name}/120/90`; }}
                    />
                  </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-text-secondary group-hover:text-text-primary transition-colors truncate uppercase tracking-tighter">
                        {cat.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                         <div className="w-1 h-1 rounded-full bg-purple-primary/50" />
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest truncate">{cat.description || 'Curated'}</p>
                      </div>
                    </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer / CTA (Fixed) ──────────────────── */}
        <div className="flex-none p-6 border-t border-border bg-gradient-to-b from-transparent to-bg-primary/40">
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative rounded-2xl p-5 border border-border bg-bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-300 group-hover:border-purple-primary/30 shadow-lg">
              <p className="text-[11px] font-black text-text-primary uppercase tracking-widest mb-2 italic">Creator Lab</p>
              <p className="text-[10px] text-text-muted mb-4 leading-relaxed font-medium">
                Join the elite circle of global curators.
              </p>
              {isAuthenticated ? (
                  <Link href="/upload" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-primary hover:bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all active:scale-95">
                    <Upload size={14} strokeWidth={3} />
                    Publish Hub
                  </Link>
              ) : (
                <Link href="/login" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-bg-elevated hover:bg-bg-hover text-text-primary text-[10px] font-black uppercase tracking-widest transition-all">
                  <Zap size={14} />
                  Initialize
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
