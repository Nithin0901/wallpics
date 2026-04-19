'use client';
/**
 * app/(auth)/login/page.jsx
 * Tabbed login — Password · Email OTP · Google OAuth
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail, Lock, Eye, EyeOff, LogIn, KeyRound,
  ArrowRight, RotateCcw, CheckCircle2, AlertCircle,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

/* ─── tiny Google SVG icon ─────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z" />
    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.2z" />
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.7 0 6.5 5.3 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z" />
  </svg>
);

/* ─── Tab definitions ───────────────────────────────────────── */
const TABS = [
  { id: 'password', label: 'Password',  icon: Lock },
  { id: 'otp',      label: 'Email OTP', icon: KeyRound },
  { id: 'google',   label: 'Google',    icon: null },
];

/* ═══════════════════════════════════════════════════════════════
   Main Page Component
═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const params    = useSearchParams();

  const [tab, setTab] = useState('password');

  // Show error from Google redirect (e.g. ?error=google_denied)
  useEffect(() => {
    const err = params.get('error');
    if (err) {
      const msg = {
        google_denied : 'Google sign-in was cancelled.',
        google_token  : 'Google authentication failed. Please try again.',
        google_profile: 'Could not retrieve your Google profile.',
        google_error  : 'Google sign-in encountered an error.',
      }[err] || 'An error occurred. Please try again.';
      toast.error(msg);
    }
  }, [params]);

  /* shared redirect after any successful login */
  function onSuccess(token, user) {
    login(token, user);
    toast.success(`Welcome back, ${user.username}! 👋`);
    if (['admin', 'superadmin'].includes(user.role)) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }

  return (
    <div className="w-full max-w-sm animate-scale-in">
      {/* ── Logo ── */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-lg"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
        >
          WH
        </div>
        <h1 className="text-2xl font-black text-text-primary">Welcome back</h1>
        <p className="text-text-muted text-sm mt-1">Sign in to your Wallpaper Hub account</p>
      </div>

      <div className="card p-7">
        {/* ── Tabs ── */}
        <div className="flex rounded-xl mb-6 p-1 gap-1 bg-bg-elevated border border-border">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-purple-primary text-white shadow-lg shadow-purple-900/20' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {Icon && <Icon size={13} />}
                {id === 'google' && (
                  <span className={active ? 'opacity-100' : 'opacity-60 grayscale'}>
                    <GoogleIcon />
                  </span>
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Panel ── */}
        {tab === 'password' && <PasswordPanel onSuccess={onSuccess} />}
        {tab === 'otp'      && <OtpPanel      onSuccess={onSuccess} />}
        {tab === 'google'   && <GooglePanel />}

        <p className="text-center text-sm text-text-muted mt-5">
          No account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Panel: Password Login (unchanged logic)
═══════════════════════════════════════════════════════════════ */
function PasswordPanel({ onSuccess }) {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', form);
      onSuccess(data.token, data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" className="input-field pl-9" required />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            className="input-field pl-9 pr-10"
            required
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Demo hint */}
      <div className="text-xs text-text-muted rounded-lg p-3 bg-purple-primary/5 border border-purple-primary/10">
        <p className="font-semibold text-purple-primary mb-1 uppercase tracking-tight">Demo Accounts (after seeding)</p>
        <p>superadmin@wallpaperhub.com / superadmin123</p>
        <p>admin@wallpaperhub.com / admin123</p>
        <p>user@wallpaperhub.com / user1234</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          : <><LogIn size={15} /> Sign In</>
        }
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Panel: Email OTP Login (2-step)
═══════════════════════════════════════════════════════════════ */
function OtpPanel({ onSuccess }) {
  const [step, setStep]     = useState('email'); // 'email' | 'code'
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);       // resend cooldown (seconds)
  const [sent, setSent]     = useState(false);

  /* countdown timer */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendOtp(e) {
    e?.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/otp/send', { email });
      setSent(true);
      setStep('code');
      setCooldown(60);
      toast.success('OTP sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/otp/verify', { email, otp });
      onSuccess(data.token, data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 1: Email ── */
  if (step === 'email') {
    return (
      <form onSubmit={sendOtp} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">Email address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input-field pl-9"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="text-xs text-text-muted rounded-lg p-3 bg-purple-primary/5 border border-purple-primary/10">
          <p className="text-purple-primary font-semibold mb-1 uppercase tracking-tight">No password needed</p>
          <p>We'll email you a one-time code valid for 10 minutes. New users get an account automatically.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <><ArrowRight size={15} /> Send One-Time Code</>
          }
        </button>
      </form>
    );
  }

  /* ── Step 2: OTP code ── */
  return (
    <form onSubmit={verifyOtp} className="space-y-4">
      {/* Sent confirmation banner */}
      <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-500">Code sent!</p>
          <p className="text-text-muted text-xs">Check <strong className="text-text-secondary">{email}</strong> for a 6-digit code.</p>
        </div>
      </div>

      {/* OTP input */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">6-digit code</label>
        <div className="relative">
          <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="input-field pl-9 tracking-widest text-center text-lg font-bold"
            autoFocus
            required
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          : <><LogIn size={15} /> Verify &amp; Sign In</>
        }
      </button>

      {/* Resend + back */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => { setStep('email'); setOtp(''); setSent(false); }}
          className="text-text-muted hover:text-text-secondary flex items-center gap-1"
        >
          ← Change email
        </button>
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || cooldown > 0}
          className={`flex items-center gap-1 font-semibold ${
            cooldown > 0 ? 'text-text-muted' : 'text-purple-primary hover:text-purple-600'
          }`}
        >
          <RotateCcw size={12} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Panel: Google OAuth
═══════════════════════════════════════════════════════════════ */
function GooglePanel() {
  const [loading, setLoading] = useState(false);

  function handleGoogle() {
    setLoading(true);
    window.location.href = '/api/auth/google';
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="text-xs text-text-muted rounded-lg p-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-purple-400 font-semibold mb-1">One-click sign-in</p>
        <p>Sign in instantly with your Google account. New users get an account automatically — no registration required.</p>
      </div>

      {/* Google button */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-border ${
          loading 
            ? 'bg-bg-elevated/40 text-text-muted' 
            : 'bg-bg-elevated hover:bg-bg-hover text-text-primary'
        }`}
      >
        {loading
          ? <div className="w-4 h-4 rounded-full border-2 border-purple-primary/30 border-t-purple-primary animate-spin" />
          : <GoogleIcon />
        }
        {loading ? 'Redirecting to Google…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-muted">
        <div className="flex-1 h-px bg-border" />
        <span>or use another method</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Quick links to other tabs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '🔑 Password login', tab: 'password' },
          { label: '✉️ Email OTP',       tab: 'otp' },
        ].map(({ label }) => (
          <div
            key={label}
            className="text-center py-2 rounded-lg text-[10px] font-bold text-text-muted uppercase tracking-tight bg-bg-elevated/40 border border-border"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
