'use client';
/**
 * app/(auth)/register/page.jsx
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', {
        username: form.username, email: form.email, password: form.password,
      });
      login(data.token, data.user);
      toast.success('Account created! Welcome to Wallpaper Hub 🎉');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-scale-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-lg" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          WH
        </div>
        <h1 className="text-2xl font-black text-text-primary">Join Wallpaper Hub</h1>
        <p className="text-text-muted text-sm mt-1">Create your free account and start exploring</p>
      </div>

      <div className="card p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" value={form.username} onChange={set('username')} placeholder="cooluser123" className="input-field pl-9" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" className="input-field pl-9" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 6 characters" className="input-field pl-9 pr-10" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Confirm Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className="input-field pl-9" required />
            </div>
          </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <><UserPlus size={15} /> Create Account</>
          }
        </button>
      </form>
      <p className="text-center text-sm text-text-muted mt-5">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-primary hover:text-purple-600 font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  </div>
  );
}
