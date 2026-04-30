'use client';
/**
 * components/home/CategorySection.jsx
 * Browse categories grid — image cards with name + count overlay.
 */
import Link from 'next/link';
import { LayoutGrid, ArrowRight } from 'lucide-react';

import { useCategories } from '@/lib/useCategories';

export default function CategorySection() {
  const { categories } = useCategories();

  if (!categories || categories.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="section-header items-end mb-10">
        <div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-primary mb-3 block">
             Curated Discovery
           </span>
           <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter uppercase italic">
             AESTHETIC <span className="gradient-text">CURATIONS</span>
           </h2>
        </div>
        <Link
          href="/search"
          className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-purple-primary flex items-center gap-2 transition-all border-b border-transparent hover:border-purple-primary pb-1"
        >
          View Library <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.slice(0, 8).map((cat, idx) => {
          // Create a dynamic feel with some items being wider
          const isWide = idx === 0 || idx === 5;
          
          return (
            <Link
              key={cat._id || cat.name}
              href={`/search?subCategory=${encodeURIComponent(cat.name)}`}
              className={`group relative rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-700 hover:-translate-y-2 border border-border ${
                isWide ? 'md:col-span-2' : 'col-span-1'
              }`}
              style={{ aspectRatio: isWide ? '21/9' : '1' }}
            >
              <img
                src={cat.image || `https://images.unsplash.com/photo-${cat.seed || '1618005182384-a83a8bd57fbe'}?auto=format&fit=crop&q=80&w=800`}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                onError={(e) => { 
                  if (!cat.image) {
                    e.target.src = `https://picsum.photos/seed/${cat.name}/800/800`; 
                  }
                }}
              />
              
              {/* Dynamic Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-[10px] font-black text-purple-primary uppercase tracking-[0.3em] mb-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                    Collection
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-text-primary italic uppercase tracking-tighter drop-shadow-sm">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1 max-w-[150px] truncate">
                        {cat.description || 'Verified Curation'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-primary/10 backdrop-blur-md border border-purple-primary/20 flex items-center justify-center text-purple-primary opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-purple-primary hover:text-white shadow-xl">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
