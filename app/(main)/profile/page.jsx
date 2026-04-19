'use client';
/**
 * app/(main)/profile/page.jsx
 * User profile page — stats, my uploads tab, liked wallpapers tab.
 */
import { useState, useEffect } from 'react';
import { User, Upload, Heart, Grid } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import WallpaperCard from '@/components/ui/WallpaperCard';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EditWallpaperModal from '@/components/ui/EditWallpaperModal';

const TABS = [
  { id: 'uploads', label: 'My Uploads', icon: Upload },
  { id: 'likes', label: 'Liked', icon: Heart },
  { id: 'downloads', label: 'Downloads', icon: Grid },
];

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('uploads');
  const [profileData, setProfileData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [likes, setLikes] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWallpaper, setEditingWallpaper] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    async function load() {
      try {
        const [profile, myUploads, myLikes, myDownloads] = await Promise.all([
          apiClient.get('/users/profile'),
          apiClient.get('/users/my-uploads'),
          apiClient.get('/users/my-likes'),
          apiClient.get('/users/my-downloads'),
        ]);
        setProfileData(profile.data);
        setUploads(myUploads.data.wallpapers);
        setLikes(myLikes.data.wallpapers);
        setDownloads(myDownloads.data.wallpapers);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);// eslint-disable-line

  async function handleDelete(wallpaperId) {
    if (!confirm('Delete this wallpaper permanently?')) return;
    try {
      await apiClient.delete(`/wallpapers/${wallpaperId}`);
      setUploads((prev) => prev.filter((w) => w._id !== wallpaperId));
      toast.success('Wallpaper deleted');
    } catch { toast.error('Delete failed'); }
  }

  function handleEdit(wallpaper) {
    setEditingWallpaper(wallpaper);
    setIsEditOpen(true);
  }

  function handleUpdate(updated) {
    setUploads(prev => prev.map(w => w._id === updated._id ? { ...w, ...updated } : w));
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;
    setIsCancelling(true);
    try {
      const { data } = await apiClient.post('/subscriptions/cancel');
      setProfileData(prev => ({ 
        ...prev, 
        user: { 
          ...prev.user, 
          subscription: 'free', 
          subscriptionExpiresAt: null, 
          subscriptionStartDate: null 
        } 
      }));
      if (updateUser) updateUser(data.user);
      toast.success('Subscription cancelled successfully');
    } catch { 
      toast.error('Failed to cancel subscription'); 
    } finally {
      setIsCancelling(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  const stats = profileData?.stats || {};
  // Use API-fetched user as source of truth for subscription fields (localStorage may be stale)
  const profileUser = profileData?.user || user || {};

  return (
    <div className="animate-slide-up max-w-[1400px] mx-auto px-4">
      {/* ── Enhanced Profile Header ─────────────────────── */}
      <div className="relative mb-12 overflow-hidden rounded-[3rem] p-12 bg-bg-card border border-white/5 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-purple-600/20 via-transparent to-indigo-600/20" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-12">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-purple-900/40 relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
              {profileUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>

          {/* Identity & Core Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="text-5xl font-black text-text-primary uppercase italic tracking-tighter leading-none">
                {profileUser?.username || 'Guest'}
              </h1>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] badge-${profileUser?.role || 'user'} border border-white/10 shadow-xl`}>
                {profileUser?.role || 'user'} curator
              </span>
            </div>
            
            <p className="text-text-muted text-sm font-medium mb-8 flex items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2 italic uppercase font-black text-[10px] tracking-widest"><User size={12} className="text-purple-400" /> {profileUser?.email}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="uppercase font-black text-[10px] tracking-widest">Joined {new Date(profileUser?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </p>

            {/* Quick Stats Grid */}
            <div className="flex items-center justify-center md:justify-start gap-12">
              <div className="flex flex-col items-center md:items-start">
                <p className="text-3xl font-black text-text-primary italic tracking-tighter">{stats.uploads || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Creations</p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <p className="text-3xl font-black text-text-primary italic tracking-tighter">{stats.likes || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Interactions</p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <p className="text-3xl font-black text-text-primary italic tracking-tighter">{(downloads || []).length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Collection</p>
              </div>
            </div>
          </div>

          {/* Subscription Status Card */}
          <div className="md:w-80 p-6 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
             <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">Member Tier</p>
                {profileUser?.subscription && profileUser.subscription !== 'free' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="h-8 px-4 rounded-full border border-red-500/30 text-red-400 text-[9px] font-black hover:bg-red-500 transition-colors uppercase disabled:opacity-50"
                  >
                    {isCancelling ? '...' : 'CANCEL'}
                  </button>
                )}
             </div>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center border border-purple-500/20">
                   <Upload size={20} className="text-purple-400" />
                </div>
                <div>
                   <p className="text-xl font-black text-purple-400 capitalize italic leading-none">{profileUser?.subscription || 'Free'}</p>
                   <p className="text-[9px] font-bold text-text-muted tracking-widest uppercase mt-1">Status: Active Service</p>
                </div>
             </div>

             <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                   <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Valid Until</p>
                   <p className="text-[10px] font-bold text-white mt-0.5">
                     {profileUser?.subscriptionExpiresAt ? new Date(profileUser.subscriptionExpiresAt).toLocaleDateString() : 'Lifetime'}
                   </p>
                </div>
                <div className="flex flex-col text-right">
                   <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Access Mode</p>
                   <p className="text-[10px] font-bold text-white mt-0.5 uppercase">Premium Cloud</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#13131f', border: '1px solid rgba(124,58,237,0.1)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-purple-primary text-white shadow-purple-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'uploads' && (
        (uploads || []).length === 0 ? (
          <div className="text-center py-20">
            <Upload size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-lg font-medium text-text-secondary">No uploads yet</p>
            <p className="text-sm text-text-muted mb-5">Share your first wallpaper with the community!</p>
            <button onClick={() => router.push('/upload')} className="btn-primary">Upload Now</button>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {(uploads || []).filter(Boolean).map((w) => (
              <WallpaperCard 
                key={w._id} 
                wallpaper={{...w, uploadedBy: profileUser}} 
                showStatus={true} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'likes' && (
        (likes || []).length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-lg font-medium text-text-secondary">No liked wallpapers</p>
            <p className="text-sm text-text-muted">Start exploring and like your favorites!</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {(likes || []).filter(Boolean).map((w) => <WallpaperCard key={w._id} wallpaper={w} />)}
          </div>
        )
      )}

      {activeTab === 'downloads' && (
        (downloads || []).length === 0 ? (
          <div className="text-center py-20">
            <Grid size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-lg font-medium text-text-secondary">No downloads yet</p>
            <p className="text-sm text-text-muted">Your curated collection will appear here.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {(downloads || []).filter(Boolean).map((w) => <WallpaperCard key={w._id} wallpaper={w} />)}
          </div>
        )
      )}
      {/* Edit Wallpaper Modal */}
      <EditWallpaperModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        wallpaper={editingWallpaper}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
