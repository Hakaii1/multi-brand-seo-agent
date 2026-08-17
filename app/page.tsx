export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero Section */}
      <section className="pt-24 pb-16 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)] mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Content Pipeline
          </div>
        </div>

        <h1 className="animate-fade-in-up animate-delay-100 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Multi-Brand SEO{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Content Agent
          </span>
        </h1>

        <p className="animate-fade-in-up animate-delay-200 max-w-2xl mx-auto text-lg text-[var(--text-secondary)] leading-relaxed mb-10">
          Generate SEO-optimized content with Groq&apos;s Llama 3, validated by a deterministic
          verification engine that never trusts the LLM. Every post is schema-checked,
          deduplicated, and structurally verified before it can be published.
        </p>

        <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#brands"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium text-sm hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            Explore Brands ↓
          </a>
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-all duration-300"
          >
            View Source ↗
          </a>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16">
        <div className="animate-fade-in-up animate-delay-400 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '🤖',
              title: 'Groq AI Generation',
              desc: 'Llama 3 via Groq produces SEO-optimized MDX posts with structured frontmatter, driven by keyword targeting prompts.',
            },
            {
              icon: '🔍',
              title: 'Deterministic Verification',
              desc: 'Zod schema validation, duplicate detection, heading hierarchy checks, and link integrity — no LLM output is trusted.',
            },
            {
              icon: '🚀',
              title: 'Multi-Brand Delivery',
              desc: 'Next.js App Router serves each brand with dynamic metadata, OpenGraph, canonical URLs, and JSON-LD schema markup.',
            },
          ].map((card) => (
            <div key={card.title} className="glass-card p-6">
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{card.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Showcases */}
      <section id="brands" className="py-16">
        <h2 className="text-2xl font-bold text-center mb-12 tracking-tight">
          Brand Showcases
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand A Card */}
          <a href="/brand-a" className="group glass-card glow-brand-a overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500" />
            <div className="p-8">
              <span className="tag tag-brand-a mb-4">Brand A</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mt-4 mb-2 group-hover:text-indigo-300 transition-colors">
                Modern Development Hub
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                Deep-dives into modern web architecture, frontend frameworks, and engineering
                best practices. Targeting technical decision-makers and senior developers.
              </p>
              <div className="flex items-center gap-2 text-sm text-indigo-400 font-medium">
                Explore articles
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </a>

          {/* Brand B Card */}
          <a href="/brand-b" className="group glass-card glow-brand-b overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />
            <div className="p-8">
              <span className="tag tag-brand-b mb-4">Brand B</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mt-4 mb-2 group-hover:text-emerald-300 transition-colors">
                Technical SEO Authority
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                Actionable SEO strategies, technical optimization guides, and data-driven
                approaches to organic growth. Built for marketers and growth engineers.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                Explore articles
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Pipeline Visual */}
      <section className="py-16 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12 tracking-tight">
          How It Works
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          {[
            { step: '1', label: 'CLI Trigger', sub: 'brand-a "keyword"' },
            { step: '2', label: 'Groq AI ⟶ MDX', sub: 'compound-mini model' },
            { step: '3', label: 'Verify Content', sub: 'Zod + SEO checks' },
            { step: '4', label: 'PR for Review', sub: 'GitHub Actions CI' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="glass-card p-4 text-center min-w-[140px]">
                <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                  STEP {item.step}
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{item.sub}</div>
              </div>
              {i < 3 && (
                <span className="text-[var(--text-muted)] text-lg hidden md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
