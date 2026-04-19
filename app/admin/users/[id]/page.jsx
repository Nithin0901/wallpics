'use client';
/**
 * app/admin/users/[id]/page.jsx
 * Admin view of a specific user profile — intensive stats, uploads, likes, and downloads.
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, Mail, Shield, Calendar, Clock, 
  Upload, Heart, Grid, ArrowLeft, Trash2, 
  ExternalLink, Sparkles, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';

const TABS = [
  { id: 'uploads', label: 'Uploaded Content', icon: Upload },
  { id: 'likes', label: 'Favorite Library', icon: Heart },
  { id: 'downloads', label: 'Download History', icon: Grid },
];

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5">
      <Icon size={18} className="mb-2" style={{ color }} />
      <span className="text-xl font-bold text-text-primary">{value}</span>
      <p className="text-[10px] font-black uppercase text-text-muted mt-1 tracking-widest">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uploads');

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/admin/users/${id}`);
        setData(res.data);
      } catch (err) {
        toast.error('User profile inaccessible');
        router.push('/admin/users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] animate-pulse">Scanning Profile...</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <p className="text-text-muted text-sm">User data unavailable.</p>
    </div>
  );

  const { user, stats, uploads } = data;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
      {/* Navigation */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-8 text-text-muted hover:text-purple-400 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Directory</span>
      </button>

      {/* Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 card p-8 flex flex-col md:flex-row items-center gap-8">
          <div 
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-purple-900/40 shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-black text-text-primary italic tracking-tight uppercase">{user.username}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase badge-${user.role}`}>
                {user.role}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
               <div className="flex items-center justify-center md:justify-start gap-2 text-text-muted">
                 <Mail size={14} className="text-purple-400" />
                 <span className="text-sm font-medium">{user.email}</span>
               </div>
               <div className="flex items-center justify-center md:justify-start gap-2 text-text-muted">
                 <Calendar size={14} className="text-purple-400" />
                 <span className="text-xs">Identified on {new Date(user.createdAt).toLocaleDateString()}</span>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <StatItem icon={Upload} label="Uploads" value={stats.uploads} color="#a855f7" />
            <StatItem icon={Heart} label="Likes" value={stats.likes} color="#f43f5e" />
            <StatItem icon={Grid} label="DLs" value={stats.downloads} color="#3b82f6" />
          </div>
        </div>

        {/* Subscription Info Card */}
        <div className="card p-8 border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield size={80} className="text-purple-400" />
          </div>
          <div className="relative">
            <h3 className="text-[10px] font-black uppercase text-text-muted mb-6 tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={12} className="text-purple-400" /> Subscription Protocol
            </h3>
            
            <div className="space-y-4">
               <div>
                 <p className="text-[10px] font-black text-text-muted uppercase mb-1">Current Tier</p>
                 <p className="text-lg font-black text-text-primary italic uppercase tracking-wider">{user.subscription || 'Free'}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] font-black text-text-muted uppercase mb-1 flex items-center gap-1.5"><Clock size={10} /> Active Date</p>
                   <p className="text-xs font-bold text-text-primary">
                     {user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-text-muted uppercase mb-1 flex items-center gap-1.5"><Calendar size={10} /> Expiry Date</p>
                   <p className="text-xs font-bold text-text-secondary">
                     {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Lifetime'}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Activity Area */}
      <div className="card overflow-hidden">
        {/* Detail Tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.02]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'bg-purple-500/10 border-purple-500 text-text-primary' 
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-white/[0.01]'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content List */}
        <div className="p-8">
          {activeTab === 'uploads' && (
            uploads.length === 0 ? (
              <div className="py-20 text-center text-text-muted">No uploaded assets tracked.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploads.filter(Boolean).map((w) => (
                   <div key={w._id} className="flex gap-4 p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                         <img src={w.image} alt={w.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-black text-text-primary truncate uppercase italic">{w.title}</h4>
                            <StatusBadge status={w.status} />
                         </div>
                         <div className="flex items-center gap-4 text-[10px] text-text-muted font-bold">
                            <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <Link href={`/wallpaper/${w._id}`} className="hover:text-purple-400 flex items-center gap-1">
                               <ExternalLink size={10} /> WEB VIEW
                            </Link>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'likes' && (
            (user.likedWallpapers || []).length === 0 ? (
              <div className="py-20 text-center text-text-muted">No favorite assets recorded.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.likedWallpapers || []).filter(Boolean).map((w) => (
                   <div key={w._id} className="flex gap-4 p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                         <img src={w.image} alt={w.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-black text-text-primary truncate uppercase italic mb-1">{w.title}</h4>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">{w.status}</span>
                            <Link href={`/wallpaper/${w._id}`} className="text-[10px] font-black text-blue-400 hover:underline flex items-center gap-1">
                               EXPLORE <ArrowLeft size={10} className="rotate-180" />
                            </Link>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'downloads' && (
            (user.downloadedWallpapers || []).length === 0 ? (
              <div className="py-20 text-center text-text-muted">No download activity logged.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.downloadedWallpapers || []).filter(Boolean).map((w) => (
                   <div key={w._id} className="flex gap-4 p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-green-500/30 transition-all">
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                         <img src={w.image} alt={w.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-black text-text-primary truncate uppercase italic mb-1">{w.title}</h4>
                         <div className="flex items-center justify-between">
                            <StatusBadge status={w.status} />
                            <Link href={`/wallpaper/${w._id}`} className="text-[10px] font-black text-green-400 hover:underline flex items-center gap-1 uppercase tracking-tighter">
                               Resource Access <ExternalLink size={10} />
                            </Link>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
