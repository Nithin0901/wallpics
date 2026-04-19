'use client';
/**
 * components/layout/AdminSidebar.jsx
 * Admin panel left sidebar — navigation + sections + user card.
 * Refactored for mobile (slide-over).
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Clock, CheckCircle, XCircle, Tag,
  Users, BarChart3, Settings, LogOut, ShieldCheck, Home, X
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'CONTENT',
    items: [
      { label: 'Pending Wallpapers', href: '/admin/pending', icon: Clock, badge: true },
      { label: 'Approved Wallpapers', href: '/admin/approved', icon: CheckCircle },
      { label: 'Rejected Wallpapers', href: '/admin/rejected', icon: XCircle },
      { label: 'Categories', href: '/admin/categories', icon: Tag },
      { label: 'Web Scraper', href: '/admin/scraper', icon: LayoutDashboard },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({ pendingCount = 0, isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        className={`fixed top-0 left-0 z-[150] h-full w-60 bg-bg-secondary border-r border-border transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ── Logo ──────────────────────────────────── */}
        <div className="flex-none flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              WH
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-none">Wallpaper Hub</p>
              <p className="text-[10px] font-semibold text-text-muted tracking-widest mt-0.5">
                ADMIN PANEL
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Content ─────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Home link */}
          <div className="px-3 pt-3 flex gap-2">
            <Link
              href="/"
              className="nav-item flex-1 bg-purple-primary/5 hover:bg-purple-primary/10 text-purple-primary font-semibold"
            >
              <Home size={15} />
              View Website
            </Link>
          </div>

          {/* Dashboard link */}
          <div className="px-3 py-2">
            <Link
              href="/admin"
              className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </div>

          {/* Section Groups */}
          <div className="px-3 space-y-5 pb-4 mt-2">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2 px-2">
                  {section.title}
                </p>
                <nav className="space-y-0.5">
                  {section.items.map(({ label, href, icon: Icon, badge }) => {
                    const active = pathname === href;
                    return (
                      <Link key={label} href={href} className={`nav-item ${active ? 'active' : ''} relative`}>
                        <Icon size={15} />
                        <span className="flex-1">{label}</span>
                        {badge && pendingCount > 0 && (
                          <span
                            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-primary text-white"
                          >
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* ── User Card (Fixed) ─────────────────────── */}
        <div className="flex-none p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.username}</p>
              <p className="text-xs text-text-muted capitalize flex items-center gap-1">
                <ShieldCheck size={11} />
                {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-green shrink-0" />
            <span className="text-xs text-text-muted">Online</span>
          </div>
          <button
            onClick={logout}
            className="nav-item w-full text-accent-red hover:!bg-accent-red/10 hover:!text-accent-red"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
