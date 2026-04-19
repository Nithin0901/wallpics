'use client';
/**
 * app/admin/reports/page.jsx — Platform analytics & reports overview.
 */
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Heart, Download, Eye, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';

function MetricRow({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#13131f', border: '1px solid rgba(124,58,237,0.08)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="text-sm font-bold text-text-primary">{value?.toLocaleString() || '0'}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/stats').then((r) => {
      setStats(r.data.stats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
          <BarChart3 size={22} className="text-yellow-400" />
          Platform Reports
        </h1>
        <p className="text-text-muted text-sm mt-1">Overview of platform activity and metrics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Content Metrics</p>
            <div className="space-y-2">
              <MetricRow label="Total Wallpapers" value={(stats?.pending || 0) + (stats?.approved || 0) + (stats?.rejected || 0)} icon={TrendingUp} color="#7c3aed" />
              <MetricRow label="Live (Approved)" value={stats?.approved || 0} icon={TrendingUp} color="#10b981" />
              <MetricRow label="Pending Review"  value={stats?.pending || 0}  icon={TrendingUp} color="#a78bfa" />
              <MetricRow label="Rejected"         value={stats?.rejected || 0} icon={TrendingUp} color="#ef4444" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">User Metrics</p>
            <div className="space-y-2">
              <MetricRow label="Total Users"      value={stats?.totalUsers || 0} icon={Users}    color="#3b82f6" />
              <MetricRow label="Total Likes"      value={stats?.totalLikes || 0} icon={Heart}    color="#f43f5e" />
              <MetricRow label="Total Downloads"  value={stats?.totalDownloads || 0} icon={Download} color="#3b82f6" />
              <MetricRow label="Total Views"      value={stats?.totalViews || 0}     icon={Eye}     color="#8b5cf6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
