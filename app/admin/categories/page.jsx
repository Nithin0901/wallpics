'use client';
/**
 * app/admin/categories/page.jsx
 * Admin dashboard to manage categories (Create, Delete).
 */
import { useState } from 'react';
import { Tag, Plus, Trash2, Hash, Pencil, X as CloseIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import { useCategories } from '@/lib/useCategories';

export default function AdminCategoriesPage() {
  const { categories, loading, refreshCategories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [seed, setSeed] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setEmoji('');
    setSeed('');
    setEditingId(null);
  };

  const handleEditClick = (cat) => {
    setName(cat.name);
    setDescription(cat.description || '');
    setEmoji(cat.emoji || '');
    setSeed(cat.seed || '');
    setEditingId(cat._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');

    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put('/admin/categories', { id: editingId, name, description, emoji, seed });
        toast.success('Category updated!');
      } else {
        await apiClient.post('/admin/categories', { name, description, emoji, seed });
        toast.success('Category created!');
      }
      resetForm();
      await refreshCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id, categoryName) {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category?`)) return;
    try {
      await apiClient.delete(`/admin/categories?id=${id}`);
      toast.success('Category deleted');
      await refreshCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-text-primary flex items-center gap-2 mb-1">
          <Tag size={22} className="text-purple-400" />
          Manage Categories
        </h1>
        <p className="text-text-muted text-sm">
          Add, edit or remove dynamic categories that users can assign to Wallpapers.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="xl:col-span-1">
          <div className="card p-5 sticky top-24">
            <div className="flex justify-between items-center mb-4 border-b border-[rgba(124,58,237,0.1)] pb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                {editingId ? (
                  <>
                    <Pencil size={14} className="text-accent-yellow" /> Edit Category
                  </>
                ) : (
                  <>
                    <Plus size={14} className="text-purple-400" /> Create New
                  </>
                )}
              </h2>
              {editingId && (
                <button 
                  onClick={resetForm}
                  className="p-1 hover:bg-bg-elevated rounded-md text-text-muted hover:text-text-primary transition-colors"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Wildlife"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description"
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Emoji</label>
                  <input
                    type="text"
                    placeholder="e.g. 🦁"
                    className="input-field"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Picsum Seed</label>
                  <input
                    type="text"
                    placeholder="e.g. wild"
                    className="input-field"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 justify-center py-2.5 btn-primary`}
                  style={editingId ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)' } : {}}
                >
                  {isSubmitting 
                    ? (editingId ? 'Updating...' : 'Creating...') 
                    : (editingId ? 'Update Category' : 'Create Category')
                  }
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-outline px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[rgba(124,58,237,0.1)] flex justify-between items-end">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Directory
                </h2>
                <p className="text-sm font-semibold mt-1">
                  {categories.length} Total Categories
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-text-muted">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No categories found. Create one.</div>
            ) : (
              <div className="divide-y divide-[rgba(124,58,237,0.05)]">
                {categories.map((cat) => (
                  <div 
                    key={cat._id} 
                    className={`p-4 flex items-center justify-between transition-colors group ${
                      editingId === cat._id ? 'bg-[rgba(245,158,11,0.05)]' : 'hover:bg-[rgba(124,58,237,0.02)]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-bg-elevated border border-[rgba(124,58,237,0.15)] flex-shrink-0">
                        <span className="text-xl leading-none">{cat.emoji || '📁'}</span>
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          {cat.name}
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <Hash size={11} /> Seed: {cat.seed || 'none'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block mr-4">
                        <p className="text-xs text-text-muted">Description</p>
                        <p className="text-xs font-medium text-text-secondary w-40 truncate">
                          {cat.description || '—'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditClick(cat)}
                        className={`p-2 rounded-lg transition-colors ${
                          editingId === cat._id 
                            ? 'bg-accent-yellow/20 text-accent-yellow' 
                            : 'text-text-muted hover:text-accent-yellow hover:bg-accent-yellow/10'
                        }`}
                        title="Edit category"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
