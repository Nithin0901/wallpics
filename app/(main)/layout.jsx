'use client';
/**
 * app/(main)/layout.jsx
 * Public layout: sidebar (fixed) + top navbar + scrollable content.
 */
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';
import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Fixed left sidebar (Desktop) & Slide-over (Mobile) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on large screens */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <TopNavbar onMenuToggle={() => setIsSidebarOpen(true)} />
        <main className="p-4 lg:p-6 max-w-[1600px] flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
