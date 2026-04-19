'use client';
/**
 * app/admin/layout.jsx — Admin panel layout with sidebar + top navbar.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminNavbar from '@/components/layout/AdminNavbar';
import apiClient from '@/lib/apiClient';

export default function AdminLayout({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      apiClient.get('/admin/stats').then((r) => {
        setPendingCount(r.data.stats?.pending || 0);
      }).catch(() => {});
    }
  }, [isAdmin]);

  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar 
        pendingCount={pendingCount} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="lg:ml-60">
        <AdminNavbar 
          pendingCount={pendingCount} 
          onMenuToggle={() => setIsSidebarOpen(true)}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
