'use client';
/**
 * components/layout/AdminNavbar.jsx
 * Admin panel top bar — hamburger, notification, admin user info.
 */
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, Bell, ChevronDown } from 'lucide-react';

export default function AdminNavbar({ onMenuToggle, pendingCount = 0 }) {
  const { user } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-20 bg-bg-secondary border-b border-border"
    >
      {/* Left: hamburger */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Right: notifications + admin info */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: '#ef4444' }}
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[rgba(124,58,237,0.15)]" />

        {/* Admin user info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-text-primary leading-none">{user?.username}</p>
            <p className="text-[11px] text-text-muted capitalize mt-0.5">{user?.role}</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
