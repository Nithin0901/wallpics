'use client';
/**
 * components/layout/TopNavbar.jsx
 * Top navigation bar — search, categories link, upload, auth buttons.
 * Matches reference: dark glass bar, search in center, actions on right.
 */
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Search, Upload, LayoutGrid, LogOut,
  User, Shield, Crown, Sun, Moon, Menu
} from 'lucide-react';

export default function TopNavbar({ onMenuToggle }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header
      className="sticky top-0 z-[100] w-full bg-bg-primary/60 backdrop-blur-3xl border-b border-border transition-all duration-300"
    >
      <div className="flex items-center h-16 px-4 md:px-8 max-w-[1600px] mx-auto">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Branding */}
        <Link href="/" className="flex items-center  mr-8 group transition-transform active:scale-95">
          <img
            src="/logo.png"
            alt="AUROVOID Logo"
            className="w-14 h-14 rounded-2xl object-cover shadow-2xl shadow-purple-900/60 group-hover:scale-105 transition-transform duration-300"
          />
          <span className="hidden lg:block text-lg font-black text-text-primary italic tracking-tighter uppercase">
            AURO<span className="text-purple-primary">VOID</span>
          </span>
        </Link>

        {/* Dynamic Search Bar (Stealth Mode) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl group relative hidden md:block">
          <div className="absolute inset-0 bg-purple-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative flex items-center bg-bg-secondary border border-border focus-within:border-purple-primary/40 rounded-2xl transition-all duration-500 shadow-sm">
            <Search
              size={16}
              className="ml-4 text-text-muted group-focus-within:text-purple-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Search aesthetics, curations, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-4 pr-12 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <span className="absolute right-4 px-1.5 py-0.5 rounded-md bg-bg-elevated border border-border text-[9px] font-black text-text-muted tracking-widest hidden lg:block uppercase transition-opacity group-focus-within:opacity-0">
               SEARCH
            </span>
          </div>
        </form>

        <div className="flex items-center gap-4 ml-auto">
          {/* Main Actions */}
          <div className="flex items-center gap-1">
             <Link
              href="/search"
              className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all text-sm font-black uppercase tracking-widest"
              title="Explore Gallery"
            >
              <LayoutGrid size={18} />
            </Link>
            {isAuthenticated && (
               <Link
                href="/upload"
                className="hidden sm:flex items-center gap-2 p-2.5 px-4 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Upload size={16} />
                <span>Publish</span>
              </Link>
            )}
          </div>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:border-purple-primary/30 bg-bg-secondary hover:bg-bg-hover transition-all duration-300 group overflow-hidden"
          >
            {/* Glow on hover */}
            <span className="absolute inset-0 rounded-xl bg-purple-primary/10 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
            <span
              className="relative transition-transform duration-500"
              style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              {theme === 'dark'
                ? <Sun size={15} className="text-amber-primary drop-shadow-[0_0_8px_var(--color-amber-primary)] opacity-80" />
                : <Moon size={15} className="text-purple-primary drop-shadow-[0_0_8px_var(--color-purple-primary)] opacity-80" />
              }
            </span>
          </button>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* User Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/plans"
                  className={`hidden lg:flex items-center gap-2 py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all shadow-sm ${
                    user?.subscription && user.subscription !== 'free'
                      ? 'bg-purple-primary/10 border-purple-primary/30 text-purple-primary hover:bg-purple-primary/20'
                      : 'bg-amber-primary/10 border-amber-primary/40 text-amber-primary hover:bg-amber-primary/20 shadow-amber-900/10'
                  }`}
                >
                  <Crown size={14} className={user?.subscription && user.subscription !== 'free' ? 'animate-pulse' : ''} />
                  {user?.subscription && user.subscription !== 'free' ? user.subscription : 'Upgrade Hub'}
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 group p-1 rounded-2xl transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 overflow-hidden relative"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                  </button>

                  {/* Enhanced Dropdown */}
                  {profileOpen && (
                    <div
                      className="absolute right-0 top-14 w-64 rounded-3xl bg-bg-card/90 backdrop-blur-3xl border border-border shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50 p-2"
                    >
                      <div className="px-4 py-4 mb-2 flex items-center gap-3 bg-bg-secondary rounded-2xl">
                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                            {user?.username?.[0]?.toUpperCase()}
                         </div>
                         <div className="overflow-hidden">
                           <p className="text-sm font-black text-text-primary truncate uppercase tracking-tighter italic">{user?.username}</p>
                           <p className="text-[10px] text-text-muted truncate lowercase font-medium">{user?.email}</p>
                           <div className="flex items-center gap-1.5 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest badge-${user?.role} border border-border`}>
                                {user?.role}
                              </span>
                           </div>
                         </div>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-2xl transition-all"
                        >
                          <User size={14} className="text-purple-primary" /> Identity Profile
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-2xl transition-all border-l-2 border-transparent hover:border-purple-primary"
                          >
                            <Shield size={14} className="text-purple-primary" /> Admin Command
                          </Link>
                        )}
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all"
                        >
                          <LogOut size={14} /> Terminate Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary py-2.5 px-6 text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-purple-900/40">
                Identity Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
