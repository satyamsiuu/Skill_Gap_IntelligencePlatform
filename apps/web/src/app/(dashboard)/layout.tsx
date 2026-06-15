/**
 * SGIP — Dashboard Shell Layout (placeholder)
 * Will be fully implemented in Phase 3 (Student Management).
 * For now provides a minimal wrapper for auth-protected pages.
 */
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--canvas)', padding: '40px' }}>
      {children}
    </div>
  );
}
