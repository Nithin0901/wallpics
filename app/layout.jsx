/**
 * app/layout.jsx — Root layout. Wraps with providers.
 */
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'GLALLER Hub — High-End Discovery Archving',
  description:
    'The world\'s most elite discovery hub for high-end digital assets and immersive wallpapers. Curated by creators, for the dreamers.',
  keywords: 'wallpapers, aesthetics, 4K, 8K, digital art, glaller, discovery hub',
};

// Blocking script — runs before paint to prevent flash of wrong theme
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('glaller-theme');
      if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'rgba(10, 10, 15, 0.9)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  color: '#f8fafc',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '1.25rem',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                },
                success: {
                  iconTheme: { primary: '#7c3aed', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
