'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Sparkles, Layers, Zap, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HeroBanner() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringSearch, setIsHoveringSearch] = useState(false);
  const searchRef = useRef(null);
  const containerRef = useRef(null);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized mouse position (-1 to 1)
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      
      setMousePos({ x, y });

      // Magnetic effect for search bar
      if (searchRef.current && isHoveringSearch) {
        const rect = searchRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;
        
        const strength = 0.12;
        searchRef.current.style.transform = `translate(${distanceX * strength}px, ${distanceY * strength}px) scale(1.02)`;
        searchRef.current.style.transition = 'transform 0.1s ease-out';
      } else if (searchRef.current) {
        searchRef.current.style.transform = `translate(0, 0) scale(1)`;
        searchRef.current.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHoveringSearch]);

  const stats = [
    { label: 'Curated Wallpapers', value: '1M+', icon: <Layers size={14} className="text-purple-400" /> },
    { label: 'Active Curators', value: '50k+', icon: <Zap size={14} className="text-amber-400" /> },
    { label: 'Daily Downloads', value: '250k', icon: <Sparkles size={14} className="text-blue-400" /> },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative rounded-[3rem] overflow-hidden mb-16 min-h-[660px] flex items-center justify-center border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] perspective-1000 bg-[#0A0A0F]"
    >
      {/* ─── Dynamic Background Layer ─────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* Animated Mesh Gradient */}
        <div 
          className="absolute inset-0 animate-mesh opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at ${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%, rgba(124, 58, 237, 0.3) 0%, transparent 50%),
              radial-gradient(circle at ${20 - mousePos.x * 15}% ${30 - mousePos.y * 15}%, rgba(59, 130, 246, 0.25) 0%, transparent 40%),
              radial-gradient(circle at ${80 + mousePos.x * 15}% ${70 + mousePos.y * 15}%, rgba(236, 72, 153, 0.2) 0%, transparent 45%),
              radial-gradient(circle at ${50}% ${100}%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Grain Texture Overlay */}
        <div className="grain-overlay opacity-[0.08]" />
        
        {/* Glossy Gridlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ─── Floating Decorative Elements ─────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {/* Floating Card 1 */}
        <div 
          className="absolute top-24 -left-12 w-52 h-64 rounded-2xl animate-floating opacity-40 blur-[1px] border border-white/10 overflow-hidden shadow-2xl"
          style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) rotate(-12deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=40&w=400" className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        {/* Floating Card 2 */}
        <div 
          className="absolute bottom-24 -right-16 w-60 h-72 rounded-3xl animate-floating opacity-30 blur-[2px] border border-white/10 overflow-hidden shadow-2xl"
          style={{ animationDelay: '-2s', transform: `translate(${-mousePos.x * 30}px, ${-mousePos.y * 30}px) rotate(8deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=40&w=400" className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Floating Orb Ambient */}
        <div 
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full animate-pulse"
          style={{ transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)` }}
        />
      </div>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-4xl px-8 text-center">
        {/* Enterprise Badge */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] animate-slide-up shadow-xl shadow-black/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Premium Creative Ecosystem
          </div>
        </div>

        {/* Hero Title with Shimmer and Reveal */}
        <div className="mb-12 space-y-4">
          <h1 className="text-6xl md:text-[5.5rem] lg:text-[3rem] font-black text-white leading-[0.9] tracking-tighter uppercase italic select-none">
            <span className="block animate-slide-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>Elevate Your</span>
            <span className="block italic gradient-text shimmer-text animate-slide-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              Digital Realm
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto font-medium animate-slide-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            The definitive hub for high-end digital aesthetics. 
            <span className="text-text-primary"> Curated by elite artists, delivered in 8K precision.</span>
          </p>
        </div>

        {/* Magnetic Search Interface */}
        <div className="mb-16 flex flex-col items-center">
          <form 
            ref={searchRef}
            onSubmit={handleSearch} 
            onMouseEnter={() => setIsHoveringSearch(true)}
            onMouseLeave={() => setIsHoveringSearch(false)}
            className="relative w-full max-w-2xl z-30 group"
          >
            {/* Magnetic Shadow/Glow */}
            <div className={`absolute -inset-4 bg-purple-600/20 blur-3xl rounded-full transition-opacity duration-700 ${isHoveringSearch ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="relative flex items-center glass-premium border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all duration-500">
              <Search size={24} className="ml-10 text-text-muted group-focus-within:text-purple-primary transition-colors duration-300" />
              <input 
                type="text"
                placeholder="Search aesthetics, curations, creators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent px-8 py-7 text-lg md:text-xl font-medium text-white placeholder:text-text-muted/60 focus:outline-none"
              />
              <button 
                type="submit"
                className="mr-4 px-10 py-5 bg-purple-primary hover:bg-purple-600 text-white rounded-[1.8rem] flex items-center gap-3 font-black text-sm uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 shadow-lg shadow-purple-900/40"
              >
                Explore <ArrowRight size={18} strokeWidth={3} />
              </button>
            </div>
          </form>

          {/* Trending Pills with Elastic Hover */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-slide-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mr-2 opacity-60">Trending:</span>
            {['Neo-Tokyo', 'Minimalism', 'Cinematic', 'Architectural', 'Abstract'].map((tag) => (
              <Link 
                key={tag}
                href={`/search?q=${tag}`}
                className="px-6 py-2.5 rounded-full glass border border-white/5 text-[11px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-[0_8px_20px_-8px_rgba(124,58,237,0.4)] transition-all duration-300 active:scale-95"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Community Stats Footer */}
      
      </div>

      {/* ─── Scroll Indicator ─────────────────────────────────── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-20 pointer-events-none opacity-40">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent relative">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-purple-400 animate-[bounce_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
