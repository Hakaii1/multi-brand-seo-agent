import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Multi-Brand SEO Platform',
    template: '%s | Multi-Brand SEO',
  },
  description:
    'AI-powered multi-brand content platform with deterministic SEO verification. Built with Next.js, Groq, and TypeScript.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {/* Ambient Background Glow */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/[0.04] blur-[120px]" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/[0.04] blur-[120px]" />
        </div>

        {/* Main Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                M
              </div>
              <span className="font-semibold text-[var(--text-primary)] tracking-tight">
                MultiBrand<span className="text-[var(--text-muted)]">SEO</span>
              </span>
            </a>

            <div className="flex items-center gap-6">
              <a
                href="/brand-a"
                className="text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors duration-200"
              >
                Brand A
              </a>
              <a
                href="/brand-b"
                className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors duration-200"
              >
                Brand B
              </a>
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-color)] mt-24">
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              Multi-Brand SEO Agent — AI-generated content with deterministic verification
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Built with Next.js, Groq, Zod &amp; TypeScript
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
