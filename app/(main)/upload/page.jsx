'use client';
/**
 * app/(main)/upload/page.jsx
 * Enterprise-grade wallpaper upload page.
 * Features: drag-drop zone, image preview, title + category picker, upload progress, guidelines panel.
 */
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, Image as ImageIcon, X, CheckCircle2, Info,
  FileImage, ArrowLeft, Sparkles, AlertCircle,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

import { useCategories } from '@/lib/useCategories';
import PhotoEditor from '@/components/ui/PhotoEditor';

const GUIDELINES = [
  { icon: CheckCircle2, text: 'Minimum resolution: 1920×1080 (Full HD)', color: 'text-accent-green' },
  { icon: CheckCircle2, text: 'Accepted formats: JPG, PNG, WebP', color: 'text-accent-green' },
  { icon: CheckCircle2, text: 'Maximum file size: 10 MB', color: 'text-accent-green' },
  { icon: AlertCircle,  text: 'No watermarks or logos', color: 'text-accent-yellow' },
  { icon: AlertCircle,  text: 'No explicit or offensive content', color: 'text-accent-yellow' },
  { icon: Info,         text: 'All uploads require admin approval before publishing', color: 'text-accent-blue' },
];

export default function UploadPage() {
  const { isAuthenticated, user } = useAuth();
  const { categories } = useCategories();
  const router = useRouter();

  const [title, setTitle]       = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef(null);

  function handleAddTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        setTagInput('');
      } else if (tag && tags.includes(tag)) {
        toast.error('Tag already added');
      } else if (tags.length >= 10) {
        toast.error('Maximum 10 tags allowed');
      }
    }
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter(t => t !== tagToRemove));
  }

  /* ── File handling ──────────────────────────────────────────── */
  function handleFile(selectedFile) {
    if (!selectedFile) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(selectedFile.type)) {
      toast.error('Only JPG, PNG, and WebP images are supported');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setFile(selectedFile);
    setFileInfo({
      name: selectedFile.name,
      size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: selectedFile.type.split('/')[1].toUpperCase(),
    });
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      // Detect dimensions
      const img = new Image();
      img.onload = () => {
        setFileInfo((prev) => ({
          ...prev,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
  }

  function handleEditorSave(blob, fileName) {
    // Create a new File object from the blob
    const editedFile = new File([blob], fileName, { type: blob.type });
    setFile(editedFile);
    
    // Update preview
    const newPreview = URL.createObjectURL(blob);
    setPreview(newPreview);
    
    // Update file info
    setFileInfo(prev => ({
      ...prev,
      name: fileName,
      size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: blob.type.split('/')[1].toUpperCase(),
    }));

    // Detect new dimensions
    const img = new Image();
    img.onload = () => {
      setFileInfo(prev => ({
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    };
    img.src = newPreview;
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /* ── Submit ─────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to upload'); router.push('/login'); return; }
    if (!title.trim())  { toast.error('Please enter a title'); return; }
    if (!mainCategory)  { toast.error('Please select an orientation'); return; }
    if (!subCategory)   { toast.error('Please select a theme'); return; }
    if (!file)          { toast.error('Please select an image'); return; }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('mainCategory', mainCategory);
      formData.append('subCategory', subCategory);
      formData.append('image', file);
      formData.append('tags', JSON.stringify(tags));

      await apiClient.post('/wallpapers', formData, {
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      toast.success('🎉 Wallpaper submitted for admin approval!', { duration: 5000 });
      router.push('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  /* ── Not authenticated ──────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <Upload size={36} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">Sign In to Upload</h2>
        <p className="text-text-muted max-w-sm mb-8 leading-relaxed">
          Join the Wallpaper Hub community to share your stunning wallpapers with thousands of users.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">Sign In</Link>
          <Link href="/register" className="btn-outline">Create Account</Link>
        </div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────────── */
  return (
    <div className="animate-slide-up pb-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Sparkles size={22} className="text-purple-400" />
            Upload Wallpaper
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Share your artwork with the community • Pending admin review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: Main form ───────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Drop zone / preview */}
          <div className="card overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-[rgba(124,58,237,0.1)]">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <FileImage size={15} className="text-purple-400" />
                Wallpaper Image
                <span className="text-accent-red text-xs ml-0.5">*</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">JPG, PNG, WebP · Max 10MB · Min 1920×1080</p>
            </div>

            <div className="p-5">
              {preview ? (
                /* Preview */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {/* Hover controls */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setShowEditor(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-primary hover:bg-purple-600 text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/40"
                      >
                        <Sparkles size={14} /> EDIT STUDIO
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm"
                      >
                        <ImageIcon size={14} /> Change
                      </button>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="p-2 rounded-xl bg-red-500/70 hover:bg-red-500 text-white transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {/* File info overlay */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 py-3 flex justify-between items-end"
                      style={{ background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)' }}
                    >
                      <div>
                        <p className="text-xs text-white/70 truncate max-w-[200px]">{fileInfo?.name}</p>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {fileInfo?.width}×{fileInfo?.height} · {fileInfo?.size} · {fileInfo?.type}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-accent-green/60">
                        ✓ Ready
                      </span>
                    </div>
                  </div>

                  {/* Upload progress */}
                  {loading && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Uploading...</span>
                        <span className="text-purple-400 font-semibold">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Drop zone */
                <div
                  className={`rounded-xl border-2 border-dashed transition-all cursor-pointer select-none ${
                    dragOver
                      ? 'border-purple-primary bg-purple-primary/8 scale-[1.01]'
                      : 'border-[rgba(124,58,237,0.25)] hover:border-purple-primary hover:bg-purple-primary/4'
                  }`}
                  style={{ aspectRatio: '16/9' }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                        dragOver ? 'scale-110' : ''
                      }`}
                      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                    >
                      <ImageIcon size={32} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary mb-1">
                        {dragOver ? 'Drop to upload' : 'Drag & drop your wallpaper'}
                      </p>
                      <p className="text-sm text-text-muted">
                        or click anywhere to browse files
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> JPG
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> PNG
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> WebP
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" /> Max 10MB
                      </span>
                    </div>
                    <span
                      className="px-5 py-2 rounded-xl text-sm font-semibold pointer-events-none"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
                    >
                      Choose File
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          </div>

          {/* Title input */}
          <div className="card p-5">
            <label className="block text-sm font-bold text-text-primary mb-1">
              Title <span className="text-accent-red">*</span>
            </label>
            <p className="text-xs text-text-muted mb-3">Give your wallpaper a descriptive, memorable name</p>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Sunset in the Mountains"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="input-field pr-16"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                  title.length > 80 ? 'text-accent-yellow' : 'text-text-muted'
                }`}
              >
                {title.length}/100
              </span>
            </div>
          </div>

          {/* Discovery Tags (NEW) */}
          <div className="card p-5">
            <label className="block text-sm font-bold text-text-primary mb-1 text-purple-400">
              Discovery Tags
            </label>
            <p className="text-xs text-text-muted mb-4">Press Enter or Comma to add tags (Max 10)</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase text-purple-400 animate-fade-in"
                >
                  #{tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-[10px] font-bold text-text-muted uppercase italic tracking-widest px-1">
                  No tags added yet...
                </span>
              )}
            </div>

            <div className="relative group">
               <input
                type="text"
                placeholder={tags.length < 10 ? "Add tags e.g. Neon, 4K, Cyberpunk..." : "Tag limit reached"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={tags.length >= 10}
                className="input-field border-purple-500/10 focus:border-purple-500 transition-all duration-300 group-hover:bg-bg-elevated"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <span className="text-[10px] font-black text-text-muted">{tags.length}/10</span>
              </div>
            </div>
          </div>

          {/* Category picker */}
          <div className="card p-5">
            <label className="block text-sm font-bold text-text-primary mb-1">
              Orientation (Main Category) <span className="text-accent-red">*</span>
            </label>
            <p className="text-xs text-text-muted mb-4">Choose the primary orientation for your wallpaper</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {categories.filter(c => c.type === 'main').map(({ name, emoji, description }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setMainCategory(name)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl text-center transition-all border ${
                    mainCategory === name
                      ? 'border-purple-primary bg-purple-primary/15 shadow-purple-sm'
                      : 'border-[rgba(124,58,237,0.15)] bg-bg-card hover:border-[rgba(124,58,237,0.4)] hover:bg-bg-elevated'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span
                    className={`text-sm font-bold ${
                      mainCategory === name ? 'text-purple-muted' : 'text-text-secondary'
                    }`}
                  >
                    {name}
                  </span>
                  <span className="text-[10px] text-text-muted leading-tight">{description}</span>
                  {mainCategory === name && (
                    <CheckCircle2 size={14} className="text-purple-400 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-text-primary mb-1">
              Theme (Subcategory) <span className="text-accent-red">*</span>
            </label>
            <p className="text-xs text-text-muted mb-4">Choose the most fitting theme for your wallpaper</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.filter(c => c.type === 'sub').map(({ name, emoji, description }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSubCategory(name)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl text-center transition-all border ${
                    subCategory === name
                      ? 'border-purple-primary bg-purple-primary/15 shadow-purple-sm'
                      : 'border-[rgba(124,58,237,0.15)] bg-bg-card hover:border-[rgba(124,58,237,0.4)] hover:bg-bg-elevated'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span
                    className={`text-sm font-bold ${
                      subCategory === name ? 'text-purple-muted' : 'text-text-secondary'
                    }`}
                  >
                    {name}
                  </span>
                  <span className="text-[10px] text-text-muted leading-tight">{description}</span>
                  {subCategory === name && (
                    <CheckCircle2 size={14} className="text-purple-400 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file || !title.trim() || !mainCategory || !subCategory}
            className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ borderRadius: '12px' }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Uploading... {progress > 0 && `${progress}%`}
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit for Review
              </>
            )}
          </button>
        </div>

        {/* ── Right: Guidelines & user info ─────────────────── */}
        <div className="space-y-4">
          {/* User info */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Uploading as</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{user?.username}</p>
                <span className={`text-xs badge-${user?.role} px-2 py-0.5 rounded-full`}>{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Upload guidelines */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
              Upload Guidelines
            </p>
            <div className="space-y-3">
              {GUIDELINES.map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} />
                  <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation notice */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-purple-400" />
              <p className="text-sm font-bold text-text-primary">Moderation Queue</p>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Every upload goes into a review queue. Our admin team typically approves
              wallpapers within a few hours. You can track the status in your profile.
            </p>
            <Link
              href="/profile"
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors"
            >
              View My Uploads →
            </Link>
          </div>

          {/* Progress summary */}
          {(title || mainCategory || subCategory || file) && (
            <div className="card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Ready Checklist</p>
              <div className="space-y-2">
                {[
                  { label: 'Image selected', done: !!file },
                  { label: 'Title entered', done: !!title.trim() },
                  { label: 'Orientation chosen', done: !!mainCategory },
                  { label: 'Theme chosen', done: !!subCategory },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-accent-green' : 'bg-bg-elevated border border-[rgba(124,58,237,0.2)]'}`}>
                      {done && <span className="text-[10px] text-white font-black">✓</span>}
                    </div>
                    <p className={`text-xs ${done ? 'text-text-secondary' : 'text-text-muted'}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Editor Overlay */}
      {showEditor && preview && (
        <PhotoEditor 
          imageUrl={preview}
          wallpaperTitle={title || 'Upload Preview'}
          onClose={() => setShowEditor(false)}
          onExport={handleEditorSave}
        />
      )}
    </div>
  );
}
