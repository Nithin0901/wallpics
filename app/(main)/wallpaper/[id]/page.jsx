'use client';
/**
 * app/(main)/wallpaper/[id]/page.jsx
 * Enterprise-grade Wallpaper Details Page.
 * Features: Immersive blurred background, Glassmorphism, Advanced Stats, Related grid.
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Download, Eye, ArrowLeft, Calendar,
  User, Tag, Share2, Maximize2, Monitor, 
  Info, ShieldCheck, Clock, Layers, ChevronRight, Sparkles,
  Box, Orbit
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import WallpaperCard from '@/components/ui/WallpaperCard';
import PhotoEditor from '@/components/ui/PhotoEditor';
import ImmersiveViewer from '@/components/ui/ImmersiveViewer';
import UpgradeModal from '@/components/ui/UpgradeModal';
import PremiumBadge from '@/components/ui/PremiumBadge';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all hover:scale-105" 
      style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Icon size={16} style={{ color }} className="mb-1.5" />
      <span className="text-lg font-black text-text-primary leading-none">{formatCount(value)}</span>
      <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-1.5">{label}</p>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon size={12} className="text-purple-400" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <span className="text-[11px] font-bold text-text-secondary">{value}</span>
    </div>
  );
}

export default function WallpaperDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [wallpaper, setWallpaper] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showImmersive, setShowImmersive] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState('3d'); // '3d' or '360'
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [requiredTier, setRequiredTier] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get(`/wallpapers/${id}`);
        setWallpaper(data.wallpaper);
        setRelated(data.related || []);
        
        // Track view
        apiClient.put(`/wallpapers/${id}/view`).catch(() => {});
        
        // Check like status
        if (isAuthenticated) {
          apiClient.get('/users/my-likes').then(res => {
            setLiked(res.data.wallpapers.some(w => w._id === id));
          });
        }
      } catch {
        toast.error('Wallpaper not found or removed');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id, isAuthenticated, router]);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('Please sign in to like');
    try {
      const { data } = await apiClient.put(`/wallpapers/${id}/like`);
      setLiked(data.liked);
      setWallpaper(prev => ({ ...prev, likes: data.likes }));
      toast.success(data.liked ? 'Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Action failed'); }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) return router.push(`/login?redirect=/wallpaper/${id}`);
    if (!wallpaper) return;
    
    try {
      // 1. Request binary asset from API
      // We use responseType: 'blob' to handle binary image data
      const response = await apiClient.put(
        `/wallpapers/${id}/download`, 
        {}, 
        { responseType: 'blob' }
      );
      
      // 2. Extract subscription info from headers (optional but useful for UI)
      const subType = response.headers['x-subscription'];
      
      // 3. Create a temporary object URL for the binary blob
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/webp' });
      const url = window.URL.createObjectURL(blob);
      
      // 4. Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wallpaper.title.toLowerCase().replace(/\s+/g, '-')}.webp`;
      document.body.appendChild(a);
      a.click();
      
      // 5. Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setWallpaper(prev => ({ ...prev, downloads: prev.downloads + 1 }));
      toast.success(subType === 'free' ? 'Watermarked asset downloaded' : 'Clean asset downloaded');
    } catch (err) { 
      // If responseType is blob, the error data is also a blob
      // We need to decode it to see the actual error message
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        const errorData = JSON.parse(text);
        if (errorData?.code === 'INSUFFICIENT_PLAN') {
          setUpgradeReason('tier');
          setRequiredTier(errorData.required);
          setShowUpgrade(true);
        } else if (errorData?.code === 'LIMIT_REACHED') {
          setUpgradeReason('limit');
          setShowUpgrade(true);
        } else {
          toast.error(errorData?.error || 'Download failed');
        }
      } else {
        toast.error('Download failed. Technical error.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
        <p className="text-text-muted text-sm font-medium animate-pulse">Processing Masterpiece...</p>
      </div>
    );
  }

  if (!wallpaper) return null;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Unified Pin Card ────────────────────────────── */}
        <div 
          className="bg-bg-card rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[500px] max-h-[85vh] animate-slide-up"
          style={{ background: 'linear-gradient(145deg, #13131f 0%, #0a0a0f 100%)' }}
        >
          {/* Left: Image Canvas */}
          <div className="md:w-1/2 relative group cursor-zoom-in overflow-hidden bg-black flex items-center justify-center p-4" onClick={() => setFullscreen(true)}>
            <div className="absolute inset-0 opacity-40 blur-3xl scale-125" style={{ backgroundImage: `url(${wallpaper.image})`, backgroundSize: 'cover' }} />
            <img 
              src={wallpaper.image} 
              alt={wallpaper.title}
              className="relative z-10 w-full h-full object-contain shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              onError={(e) => { e.target.src = 'https://picsum.photos/seed/wallpaper/1920/1080'; }}
            />
            
            {/* 360/Editor Quick Actions */}
            <div className="absolute top-6 left-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
               <button onClick={(e) => { e.stopPropagation(); setShowEditor(true); }} className="p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:text-purple-400 transition-all shadow-xl">
                 <Sparkles size={20} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); setImmersiveMode('360'); setShowImmersive(true); }} className="p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:text-purple-400 transition-all shadow-xl">
                 <Orbit size={20} />
               </button>
            </div>
          </div>

          {/* Right: Meta Content (Pinterest Style) */}
          <div className="md:w-1/2 p-8 lg:p-12 flex flex-col h-full bg-bg-card/50 backdrop-blur-sm border-l border-white/5 overflow-y-auto custom-scrollbar">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('URL Copied'); }} className="p-3 rounded-full hover:bg-white/5 transition-colors text-text-muted">
                  <Share2 size={24} />
                </button>
                <button 
                  onClick={handleLike} 
                  className={`p-3 rounded-full transition-all ${liked ? 'bg-red-500/10 text-red-500' : 'hover:bg-white/5 text-text-muted'}`}
                >
                  <Heart size={24} fill={liked ? "currentColor" : "none"} className={liked ? "animate-heartbeat" : ""} />
                </button>
              </div>
              <button 
                onClick={handleDownload}
                className="h-14 px-8 rounded-full bg-purple-primary hover:bg-purple-600 text-white font-black text-sm tracking-widest shadow-xl shadow-purple-900/40 transition-all active:scale-95 flex items-center gap-2"
              >
                <Download size={20} />
                GET ASSET
              </button>
            </div>

            {/* Profile Section */}
            <Link href={`/profile/${wallpaper.uploadedBy?._id}`} className="flex items-center justify-between group mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {wallpaper.uploadedBy?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-primary group-hover:text-purple-400 transition-colors uppercase italic tracking-tighter leading-none mb-1">
                    {wallpaper.uploadedBy?.username || 'Elite Creator'}
                  </h3>
                  <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Verified Curator • 4.2K Followers</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-text-muted group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Content Details */}
            <div className="flex-1">
              <h1 className="text-4xl font-black text-text-primary mb-6 uppercase italic tracking-tighter leading-[0.9]">
                {wallpaper.title}
              </h1>
              
              <div className="space-y-1 mb-10">
                <MetaItem icon={Maximize2} label="Resolution" value="3840 × 2160 (4K)" />
                <MetaItem icon={Tag} label="Category" value={wallpaper.category} />
                <MetaItem icon={Eye} label="Visibility" value={`${formatCount(wallpaper.views)} views`} />
              </div>

              {/* Discovery Tags Integrated */}
              <div className="mb-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 flex items-center gap-2">
                  <Tag size={12} className="text-purple-400" /> Discovery Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {(wallpaper.tags && wallpaper.tags.length > 0) ? (
                    wallpaper.tags.map((tag, i) => (
                      <Link 
                        key={i}
                        href={`/search?q=${tag}`}
                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-all"
                      >
                        #{tag}
                      </Link>
                    ))
                  ) : (
                    // Fallback to categories or default tags
                    [wallpaper.category, 'wallpaper', '4k', 'artwork', 'abstract'].filter(Boolean).map((tag, i) => (
                      <Link 
                        key={i}
                        href={`/search?q=${tag}`}
                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-all"
                      >
                        #{tag}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            {(isAuthenticated && (wallpaper.uploadedBy?._id === user?.id || ['admin','superadmin'].includes(user?.role))) && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-purple-400" />
                      <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Ownership Verified</span>
                   </div>
                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase badge-${wallpaper.status}`}>
                     {wallpaper.status}
                   </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Masonry More Like This ───────────────────────── */}
        <div className="mt-24">
          <div className="flex flex-col items-center mb-12">
             <div className="h-1 px-12 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent w-full max-w-md mb-8" />
             <h2 className="text-2xl font-black text-text-primary uppercase italic tracking-tighter">More like this</h2>
          </div>

          {related.length > 0 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
              {related.map((w) => (
                <div key={w._id} className="break-inside-avoid">
                  <WallpaperCard wallpaper={w} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-muted py-20 font-medium italic">No similar curations discovered yet.</p>
          )}
        </div>
      </div>

      {/* Editor Overlay */}
      {showEditor && (
        <PhotoEditor 
          imageUrl={wallpaper.image} 
          wallpaperTitle={wallpaper.title}
          onClose={() => setShowEditor(false)}
          onOpen360={() => { setShowEditor(false); setImmersiveMode('360'); setShowImmersive(true); }}
          onOpen3D={() => { setShowEditor(false); setImmersiveMode('3d'); setShowImmersive(true); }}
        />
      )}

      {/* Immersive Dimensions Overlay (NEW) */}
      {showImmersive && (
        <ImmersiveViewer 
          imageUrl={wallpaper.image}
          mode={immersiveMode}
          onClose={() => setShowImmersive(false)}
        />
      )}

      {/* ── Fullscreen Overlay ─────────────────────────── */}
      {fullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-fade-in"
          onClick={() => setFullscreen(false)}
        >
          <img 
            src={wallpaper.image} 
            className="max-w-[95%] max-h-[95vh] object-contain rounded-xl shadow-2xl transition-transform duration-700"
            alt="Fullscreen"
          />
          <button 
            className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20"
            onClick={() => setFullscreen(false)}
          >
            <CloseIcon size={24} />
          </button>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white/50 text-xs font-bold tracking-widest uppercase">
            ESC OR CLICK ANYWHERE TO DISMISS
          </div>
        </div>
      )}

      {/* Subscription Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
        requiredTier={requiredTier}
      />
    </>
  );
}

function CloseIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
