'use client';
/**
 * app/(main)/plans/page.jsx
 * Premium Subscription Tier Selection Page.
 * Features: Glossy card design, Tier comparisons, Mock upgrade flow.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Crown, Zap, Sparkles, Check, ArrowRight, 
  ShieldCheck, ZapOff, Star, Layers, Rocket
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

function PlanCard({ plan, isCurrent, onUpgrade, upgrading }) {
  const Icon = plan.id === 'free' ? ZapOff : plan.id === 'pro' ? Zap : Crown;
  
  return (
    <div 
      className={`relative p-8 rounded-[3rem] border transition-all duration-500 hover:scale-[1.02] flex flex-col group ${
        plan.highlight 
          ? 'border-purple-primary/40 bg-purple-primary/10 shadow-2xl shadow-purple-900/20 scale-105 z-10' 
          : 'border-border bg-bg-card/40'
      }`}
      style={{
        backdropFilter: 'blur(40px)'
      }}
    >
      {plan.highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-primary to-indigo-600 text-white font-black text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-purple-900/40">
          MOST POPULAR
        </div>
      )}

      <div className="mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${
          plan.highlight ? 'bg-purple-primary text-white shadow-xl shadow-purple-500/30' : 'bg-bg-elevated text-purple-primary'
        }`}>
          <Icon size={28} />
        </div>
        
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-1 uppercase font-mono italic">{plan.name}</h3>
        <p className="text-xs text-text-muted font-medium">Elevate your creative arsenal.</p>
      </div>

      <div className="flex items-baseline gap-1 mb-10">
        <span className="text-4xl font-black text-text-primary tracking-tighter">${plan.price}</span>
        <span className="text-xs text-text-muted font-bold tracking-widest uppercase">/ {plan.interval}</span>
      </div>

      <div className="space-y-4 mb-10 flex-grow">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-purple-primary/10 flex items-center justify-center text-purple-primary flex-shrink-0">
              <Check size={14} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-tight">{f}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onUpgrade(plan.id)}
        disabled={isCurrent || upgrading}
        className={`w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-black text-[11px] tracking-[0.2em] transition-all transform active:scale-95 ${
          isCurrent 
            ? 'bg-bg-elevated text-text-muted border border-border cursor-default'
            : plan.highlight
              ? 'bg-purple-primary hover:bg-purple-primary/90 text-white shadow-xl shadow-purple-900/40'
              : 'bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border'
        }`}
      >
        {upgrading ? 'PROCESSING...' : isCurrent ? 'ACTIVE PLAN' : plan.buttonText.toUpperCase()}
        {!isCurrent && <ArrowRight size={14} />}
      </button>
    </div>
  );
}

export default function PlansPage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data } = await apiClient.get('/subscriptions/plans');
        setPlans(data.plans);
      } catch {
        toast.error('Failed to load access tiers');
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleUpgrade = async (planId) => {
    if (!isAuthenticated) return router.push('/login?redirect=/plans');
    
    setUpgradingPlan(planId);
    try {
      if (planId === 'free') {
        const { data } = await apiClient.post('/subscriptions/upgrade', { plan: planId });
        updateUser(data.user);
        toast.success(data.message);
        router.push('/profile');
        setUpgradingPlan(null);
        return;
      }

      // Step 1: Create Order
      const { data: order } = await apiClient.post('/subscriptions/create-order', { plan: planId });

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Wallpaper Hub",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const { data } = await apiClient.post('/subscriptions/upgrade', {
              plan: planId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            updateUser(data.user);
            toast.success(data.message);
            router.push('/profile');
          } catch (error) {
            toast.error(error.response?.data?.error || 'Payment verification failed');
          } finally {
            setUpgradingPlan(null);
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || ''
        },
        theme: {
          color: "#9333ea" // tailwind purple-600
        },
        modal: {
          ondismiss: function() {
            setUpgradingPlan(null);
            toast.error("Payment cancelled");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error(response.error.description || "Payment failed");
        setUpgradingPlan(null);
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      toast.error('Optimization sequence failed. Try again.');
      setUpgradingPlan(null);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
      <p className="text-text-muted text-xs font-black tracking-widest uppercase animate-pulse">Initializing Tiers...</p>
    </div>
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="animate-fade-in py-12">
        <div className="text-center max-w-2xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-primary/10 border border-purple-primary/20 text-purple-primary text-[10px] font-black tracking-[0.2em] uppercase mb-6">
          <Sparkles size={12} />
          TIERED ARCHITECTURE
        </div>
        <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-6 uppercase italic">
          Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-indigo-600">Atmosphere</span>
        </h1>
        <p className="text-text-muted font-medium text-lg leading-relaxed">
          Unlock the full potential of high-fidelity visual assets. Choose a curation tier that aligns with your creative vision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto px-6">
        {plans.map((p) => (
          <PlanCard 
            key={p.id} 
            plan={p} 
            isCurrent={user?.subscription === p.id}
            onUpgrade={handleUpgrade}
            upgrading={upgradingPlan === p.id}
          />
        ))}
      </div>

      {/* Trust Badges */}
      <div className="mt-32 pt-20 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, label: 'SECURE ENCRYPTION' },
            { icon: Layers, label: '8K MASTER FILES' },
            { icon: Rocket, label: 'INSTANT PROFILING' },
            { icon: Star, label: 'ELITE CONTENT' }
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-text-muted group-hover:text-purple-primary transition-colors">
                <b.icon size={20} />
              </div>
              <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
