'use client';
import Link from 'next/link';
import { Globe, Mail, Link as LinkIcon, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-bg-secondary pt-16 pb-8">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs relative overflow-hidden shadow-2xl shadow-purple-900/40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                GL
              </div>
              <span className="text-xl font-black text-text-primary italic tracking-tighter uppercase">
                GLALLER<span className="text-purple-primary">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs font-medium">
              The world's most elite discovery hub for high-end digital assets and 
              immersive wallpapers. Curated by creators, for the dreamers.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2.5 rounded-xl bg-bg-elevated text-text-muted hover:text-purple-primary hover:bg-bg-hover transition-all shadow-sm"><Globe size={18} /></a>
              <a href="#" className="p-2.5 rounded-xl bg-bg-elevated text-text-muted hover:text-purple-primary hover:bg-bg-hover transition-all shadow-sm"><Share2 size={18} /></a>
              <a href="#" className="p-2.5 rounded-xl bg-bg-elevated text-text-muted hover:text-purple-primary hover:bg-bg-hover transition-all shadow-sm"><LinkIcon size={18} /></a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Platform Curation</h4>
            <ul className="space-y-4">
              <li><Link href="/search" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Discover Gallery</Link></li>
              <li><Link href="/trending" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Trending Now</Link></li>
              <li><Link href="/categories" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Aesthetic Themes</Link></li>
              <li><Link href="/upload" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Publish Art</Link></li>
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Artist Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/plans" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Subscription Plans</Link></li>
              <li><Link href="/guidelines" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Curation Standards</Link></li>
              <li><Link href="/api-docs" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Developer Portal</Link></li>
              <li><Link href="/license" className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Usage License</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Global Contact</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                <Mail size={16} className="text-purple-primary" />
                <span>hello@glallerhub.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                <Globe size={16} className="text-purple-primary" />
                <span>San Francisco, CA</span>
              </div>
              <div className="mt-8">
                <button className="w-full py-3.5 rounded-2xl bg-bg-elevated border border-border text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-bg-hover transition-all shadow-xl active:scale-95">
                  Join Artist Beta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
            © 2026 GLALLERHUB PLATFORM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 h-fit">
            <Link href="/privacy" className="text-[10px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Privacy Protocol</Link>
            <Link href="/terms" className="text-[10px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">Service Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
