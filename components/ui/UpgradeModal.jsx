'use client';
/**
 * components/ui/UpgradeModal.jsx
 * Premium upgrade prompt modal with glassmorphism design.
 */
import { X, Check, ArrowRight, Sparkles, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeModal({ isOpen, onClose, reason, requiredTier }) {
  if (!isOpen) return null;

  const isLimit = reason === 'limit';
  const Icon = isLimit ? Zap : Crown;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] p-10 bg-bg-card border border-border shadow-2xl animate-scale-up shadow-purple-900/10"
      >
        {/* Glow effect */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_0%,var(--color-purple-primary),transparent_70%)] opacity-[0.05] pointer-events-none" />
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-2xl hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-primary to-indigo-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-purple-900/40 relative">
             <div className="absolute inset-0 bg-white/20 blur-xl opacity-20" />
            <Icon size={36} className="relative z-10" />
          </div>

          <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2 uppercase italic">
            {isLimit ? 'Limit Reach Accomplished' : 'Unlock Elite Assets'}
          </h2>
          
          <p className="text-sm text-text-muted font-medium mb-8">
            {isLimit 
              ? "You've exhausted your daily allocation. Elevate your creative potential with increased limits." 
              : `To access this ${requiredTier?.toUpperCase()} curation, your profile requires a tiered upgrade.`}
          </p>

          <div className="w-full space-y-3 mb-12">
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-bg-elevated/50 border border-border text-left shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-primary/10 flex items-center justify-center text-purple-primary">
                <Check size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black tracking-[0.1em] text-text-secondary uppercase">UNLIMITED 8K ACCESS</span>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-bg-elevated/50 border border-border text-left shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-primary/10 flex items-center justify-center text-purple-primary">
                <Check size={18} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black tracking-[0.1em] text-text-secondary uppercase">DAILY DOWNLOAD OVERRIDE</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <Link 
              href="/plans"
              onClick={onClose}
              className="group w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-purple-primary hover:bg-purple-600 text-white font-black text-xs tracking-[0.2em] transition-all shadow-xl shadow-purple-900/40"
            >
              <Sparkles size={16} />
              EXPLORE TIERS
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button 
              onClick={onClose}
              className="text-[10px] font-black tracking-[0.3em] uppercase text-text-muted hover:text-text-primary transition-colors"
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
