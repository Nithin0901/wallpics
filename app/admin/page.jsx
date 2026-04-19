'use client';
/**
 * app/admin/page.jsx — Enterprise admin dashboard.
 * Features: animated stat cards, activity chart, recent pending with approve/reject,
 * top uploaders table, quick-action shortcuts.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Cloud, CheckCircle2, XCircle, Users, TrendingUp,
  ArrowRight, Clock, Eye, Download, Heart,
  Activity, Zap, BarChart3, ChevronRight,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────────── */
function formatNum(n = 0) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
function timeAgo(date) {
  const s = (Date.now() - new Date(date)) / 1000;
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, sublabel, color, bg, href, trend }) {
  return (
    <Link 
      href={href || '#'} 
      className="card p-6 hover:shadow-xl transition-all duration-300 group block relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg"
          style={{ background: bg }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${trend >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-text-primary mb-1 group-hover:text-purple-primary transition-colors">
        {formatNum(value)}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="text-[10px] font-medium text-text-muted mt-0.5">{sublabel}</p>
      
      {/* Decorative background glow */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity" style={{ background: color }} />
    </Link>
  );
}

/* ── Quick Action Button ─────────────────────────────────────── */
function QuickAction({ icon: Icon, label, desc, href, color, bg }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all group bg-bg-card hover:bg-bg-hover border border-border shadow-sm hover:shadow-md"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6 shadow-md" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-purple-primary transition-colors">{label}</p>
        <p className="text-[10px] font-medium text-text-muted truncate uppercase tracking-widest">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary translate-x-1 group-hover:translate-x-0 transition-all" />
    </Link>
  );
}

/* ── Pending Mini Card ───────────────────────────────────────── */
function PendingMiniCard({ wallpaper, onAction }) {
  const [status, setStatus] = useState(null);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(s) {
    setUpdating(true);
    try {
      await apiClient.put(`/wallpapers/${wallpaper._id}/status`, { status: s });
      setStatus(s);
      onAction?.(wallpaper._id, s);
      toast.success(s === 'approved' ? '✅ Approved!' : '❌ Rejected');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  if (status) {
    return (
      <div className="card p-4 flex flex-col items-center justify-center min-h-[220px] gap-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {status === 'approved' ? '✓' : '✗'}
        </div>
        <span className={`text-sm font-bold badge-${status} px-3 py-1 rounded-full`}>
          {status === 'approved' ? 'Approved' : 'Rejected'}
        </span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden group">
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={wallpaper.image}
          alt={wallpaper.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/300'; }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-primary/40 backdrop-blur-sm" />
        {/* Category */}
        <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-lg bg-bg-card/80 text-text-primary uppercase tracking-widest backdrop-blur-md border border-border">
          {wallpaper.category}
        </span>
        {/* Time */}
        <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg bg-bg-card/60 text-text-muted uppercase tracking-widest backdrop-blur-md border border-border">
          {timeAgo(wallpaper.createdAt)}
        </span>
      </div>

      <div className="p-3">
        <p className="text-sm font-bold text-text-primary truncate">{wallpaper.title}</p>
        <p className="text-xs text-text-muted mt-0.5 mb-3">
          by <span className="text-text-secondary">{wallpaper.uploadedBy?.username}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateStatus('approved')}
            disabled={updating}
            className="btn-approve flex-1 justify-center py-2 text-xs disabled:opacity-50"
          >
            <CheckCircle2 size={12} /> Approve
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={updating}
            className="btn-reject flex-1 justify-center py-2 text-xs disabled:opacity-50"
          >
            <XCircle size={12} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]               = useState(null);
  const [recentPending, setRecentPending] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/wallpapers/pending?limit=8'),
        ]);
        setStats(statsRes.data.stats);
        setRecentPending(pendingRes.data.wallpapers || []);
        setPendingCount(pendingRes.data.pagination?.total || pendingRes.data.wallpapers?.length || 0);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handlePendingAction(id, newStatus) {
    setRecentPending((prev) => prev.filter((w) => w._id !== id));
    setPendingCount((p) => Math.max(0, p - 1));
    if (stats) {
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, (prev.pending || 0) - 1),
        [newStatus]: (prev[newStatus] || 0) + 1,
      }));
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-20 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-36 rounded-xl skeleton" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-52 rounded-xl skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6 pb-6">

      {/* ── Welcome banner ──────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden px-10 py-8 bg-bg-card border border-border shadow-xl">
        {/* Background decoration */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-[0.03] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-purple-primary), transparent 70%)' }}
        />
        <div
          className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full opacity-[0.02] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-purple-primary), transparent 70%)' }}
        />
        
        <div className="relative flex items-center justify-between">
          <div className="animate-fade-in-up">
            <p className="text-[10px] text-purple-primary font-black uppercase tracking-[0.3em] mb-2">{greeting()},</p>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase italic">{user?.username} 👋</h1>
            <p className="text-text-muted text-sm mt-3 font-medium max-w-md leading-relaxed">
              {pendingCount > 0
                ? `System integrity check complete. You have ${pendingCount} creative asset${pendingCount > 1 ? 's' : ''} awaiting moderation sequence.`
                : 'All sectors secured. No pending assets requiring intervention.'}
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Activity size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Platform Sync Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Cloud}        value={stats?.pending || 0}
          label="Pending"     sublabel="Awaiting review"
          color="var(--color-purple-primary)"     bg="rgba(124,58,237,0.1)"
          href="/admin/pending"
        />
        <StatCard
          icon={CheckCircle2} value={stats?.approved || 0}
          label="Approved"    sublabel="Live on platform"
          color="#10b981"     bg="rgba(16,185,129,0.1)"
          href="/admin/approved"
        />
        <StatCard
          icon={XCircle}      value={stats?.rejected || 0}
          label="Rejected"    sublabel="Not published"
          color="#ef4444"     bg="rgba(239,68,68,0.1)"
          href="/admin/rejected"
        />
        <StatCard
          icon={Users}        value={stats?.totalUsers || 0}
          label="Total Users" sublabel="Registered accounts"
          color="#3b82f6"     bg="rgba(59,130,246,0.1)"
          color="var(--color-blue-primary)"     bg="var(--color-blue-primary-10)"
          href="/admin/users"
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          icon={Clock}    label="Review Queue"
          desc={`${pendingCount} ASSETS PENDING`}
          href="/admin/pending" color="var(--color-purple-primary)" bg="rgba(124,58,237,0.05)"
        />
        <QuickAction
          icon={Users}    label="Integrity Control"
          desc="MANAGE USERS & ROLES"
          href="/admin/users" color="var(--color-blue-primary)" bg="rgba(59,130,246,0.05)"
        />
        <QuickAction
          icon={CheckCircle2} label="Verified Catalog"
          desc="BROWSE PUBLISHED ASSETS"
          href="/admin/approved" color="var(--color-emerald-primary)" bg="rgba(16,185,129,0.05)"
        />
        <QuickAction
          icon={BarChart3} label="Neural Metrics"
          desc="ANALYTICS & REPORTS"
          href="/admin/reports" color="var(--color-amber-primary)" bg="rgba(245,158,11,0.05)"
        />
      </div>

      {/* ── Pending Wallpapers Grid ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-text-primary flex items-center gap-3 uppercase italic tracking-tighter">
              <Zap size={20} className="text-purple-primary" />
              PENDING REVIEW
              {pendingCount > 0 && (
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-purple-primary text-white shadow-lg shadow-purple-900/30 not-italic tracking-widest">
                  {pendingCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-text-muted mt-1 font-medium uppercase tracking-[0.1em]">
              Approve or reject community-uploaded wallpapers
            </p>
          </div>
          <Link
            href="/admin/pending"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-primary hover:text-purple-600 transition-all border-b border-transparent hover:border-purple-primary pb-1"
          >
            Access Vault <ArrowRight size={14} />
          </Link>
        </div>

        {recentPending.length === 0 ? (
          <div className="rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center bg-bg-card border border-border shadow-xl">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-text-primary mb-2 uppercase italic tracking-tighter">Sectors Secured</h3>
            <p className="text-text-muted text-sm max-w-xs font-medium leading-relaxed">
              No creative assets are currently awaiting moderation. Systematic verification complete.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentPending.map((w) => (
              <PendingMiniCard key={w._id} wallpaper={w} onAction={handlePendingAction} />
            ))}
          </div>
        )}
      </div>

      {/* ── Platform Summary ─────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Total wallpapers */}
          <div className="card p-6 shadow-lg bg-bg-card border border-border">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-5">Content Intelligence</p>
            <div className="space-y-4">
              {[
                { label: 'Asset Magnitude', value: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0), color: 'var(--color-purple-primary)' },
                { label: 'Approval Velocity',    value: stats.approved ? `${Math.round((stats.approved / ((stats.approved + stats.rejected) || 1)) * 100)}%` : '0%', color: 'var(--color-emerald-primary)' },
                { label: 'Active Personnel',      value: stats.totalUsers || 0, color: 'var(--color-blue-primary)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-tighter">{label}</span>
                  <span className="text-sm font-black" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown bar */}
          <div className="card p-6 shadow-lg bg-bg-card border border-border">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-5">Status Distribution</p>
            <div className="space-y-5">
              {[
                { label: 'APPROVED', value: stats.approved || 0, color: 'var(--color-emerald-primary)', total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0) },
                { label: 'PENDING',  value: stats.pending || 0,  color: 'var(--color-purple-primary)', total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0) },
                { label: 'REJECTED', value: stats.rejected || 0, color: 'var(--color-rose-primary)', total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0) },
              ].map(({ label, value, color, total }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-text-secondary tracking-widest">{label}</span>
                    <span className="text-xs font-black text-text-primary">{value}</span>
                  </div>
                  <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                      style={{ width: `${total ? Math.round((value / total) * 100) : 0}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform health */}
          <div className="card p-6 shadow-lg bg-bg-card border border-border">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-5">System Vitality</p>
            <div className="space-y-4">
              {[
                { label: 'CORE DATABASE',  status: 'OPTIMAL',  color: 'var(--color-emerald-primary)' },
                { label: 'API GATEWAY',    status: 'OPTIMAL',  color: 'var(--color-emerald-primary)' },
                { label: 'AUTH PROTOCOL',  status: 'ENCRYPTED', color: 'var(--color-emerald-primary)' },
                { label: 'ASSET VAULT',    status: 'ACTIVE',   color: 'var(--color-emerald-primary)' },
              ].map(({ label, status, color }) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="text-[9px] font-black text-text-secondary tracking-widest">{label}</span>
                  <span className="text-[9px] font-black flex items-center gap-2" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ background: 'currentColor' }} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
