'use client';
/**
 * components/ui/PremiumBadge.jsx
 * Visual indicator for wallpaper tier.
 */
import { Crown, Zap, Sparkles } from 'lucide-react';

const TIER_STLYES = {
  'pro': {
    icon: Zap,
    label: 'PRO',
    bg: 'rgba(59, 130, 246, 0.2)',
    text: 'text-blue-400',
    border: 'border-blue-400/30'
  },
  'premium': {
    icon: Crown,
    label: 'ULTRA',
    bg: 'rgba(168, 85, 247, 0.2)',
    text: 'text-purple-400',
    border: 'border-purple-400/30'
  }
};

export default function PremiumBadge({ tier, className = "" }) {
  if (!tier || tier === 'free') return null;

  const style = TIER_STLYES[tier.toLowerCase()];
  if (!style) return null;

  const Icon = style.icon;

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border ${style.border} ${style.bg} ${style.text} ${className}`}
    >
      <Icon size={12} className="fill-current" />
      <span className="text-[10px] font-black tracking-widest leading-none uppercase">{style.label}</span>
    </div>
  );
}
