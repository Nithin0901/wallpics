/**
 * app/(auth)/layout.jsx — Auth pages layout (centered, no sidebar).
 */
export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.1) 0%, #0a0a0f 60%)' }}
    >
      {children}
    </div>
  );
}
