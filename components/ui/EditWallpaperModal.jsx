'use client';
import { useState, useEffect } from 'react';
import { X, Save, Tag as TagIcon } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useCategories } from '@/lib/useCategories';

export default function EditWallpaperModal({ isOpen, onClose, wallpaper, onUpdate }) {
  const { categories } = useCategories();
  const [title, setTitle] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallpaper) {
      setTitle(wallpaper.title || '');
      setSubCategory(wallpaper.subCategory || '');
      setTagsInput(wallpaper.tags?.join(', ') || '');
    }
  }, [wallpaper]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const { data } = await apiClient.patch(`/wallpapers/${wallpaper._id}`, {
        title,
        subCategory,
        tags
      });

      toast.success('Specifications updated');
      onUpdate(data.wallpaper);
      onClose();
    } catch {
      toast.error('Failed to update masterpiece');
    } finally {
      setLoading(false);
    }
  }

  const themes = categories.filter(c => c.type === 'sub');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0A0A0F] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden glass-premium animate-scale-in">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-1 block">
                Management Lab
              </span>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Refine <span className="gradient-text">Masterpiece</span>
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-full hover:bg-white/5 transition-colors text-text-muted"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Identify Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 transition-all"
                placeholder="Enter elite title..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Aesthetic Theme</label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-purple-500/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled style={{ background: '#050508' }}>Assign Theme</option>
                {themes.map(t => (
                  <option key={t._id} value={t.name} style={{ background: '#050508' }}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Discovery Tags</label>
              <div className="relative">
                <TagIcon size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 transition-all"
                  placeholder="minimal, dark, 8k, futuristic..."
                />
              </div>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2 ml-2">Separate with commas</p>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-text-muted hover:bg-white/10 hover:text-text-primary transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-purple-primary hover:bg-purple-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Save size={16} />
                    Commit Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
