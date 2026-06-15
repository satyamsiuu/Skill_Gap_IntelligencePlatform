/**
 * SGIP — Root Layout
 * Ticket: SGIP-1.2.2.2
 *
 * Font stack (Document 4 §4.1):
 * - Geist Sans: display + headings (ties to Vercel reference point)
 * - Inter: body + UI text (best legibility at small sizes for dense UI)
 * - Geist Mono: data/numeric — renders scores and percentages as "measured facts"
 *
 * Theme: data-theme="dark" is the default (Document 4 §3.1).
 * Switching to light applies [data-theme="light"] at <html> without page reload.
 *
 * SEO baseline applied here (title, description, viewport, canonical charset).
 */
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

// ── Font Setup (Document 4 §4.1) ─────────────────────────────────────────────
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

// Inter for body/UI text (Document 4 §4.1 — "best-in-class legibility at 13–15px")
const inter = Inter({
  variable: '--font-inter-var',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'SGIP — Skill Gap Intelligence Platform',
    template: '%s | SGIP',
  },
  description:
    'Know exactly where you stand for your target role. SGIP gives you a deterministic readiness score, a precise skill gap report, and an AI-enhanced roadmap to close those gaps.',
  keywords: [
    'skill gap',
    'career readiness',
    'skill assessment',
    'career intelligence',
    'job readiness',
  ],
  authors: [{ name: 'SGIP' }],
  robots: {
    index: false, // MVP: no public indexing until launch
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0D10', // --canvas dark
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Dark mode is default (Document 4 §3.1). JS theme toggle changes this attribute.
      data-theme="dark"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${inter.variable}
        h-full
        antialiased
      `}
      suppressHydrationWarning // Needed for theme attribute set by client-side script
    >
      <head>
        {/*
          Theme initialization script — runs synchronously before paint to avoid FOUC.
          Reads user preference from localStorage; falls back to dark (default).
          Must be inline (not defer/async) to execute before first paint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('sgip-theme');
                  var theme = stored === 'light' ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  // localStorage unavailable — stay on default dark theme
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-canvas text-text-primary flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
