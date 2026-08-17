import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PostData {
  title: string;
  description: string;
  slug: string;
  targetKeyword: string;
  publishedAt: string;
  canonical: string;
  brand: string;
  content: string;
}

// ─── Brand Config ───────────────────────────────────────────────────────────

const BRAND_ACCENTS: Record<string, { gradient: string; tagClass: string; textColor: string }> = {
  'brand-a': {
    gradient: 'from-indigo-600 via-indigo-500 to-purple-500',
    tagClass: 'tag-brand-a',
    textColor: 'text-indigo-400',
  },
  'brand-b': {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    tagClass: 'tag-brand-b',
    textColor: 'text-emerald-400',
  },
};

// ─── Content Loader ─────────────────────────────────────────────────────────

function getPost(brand: string, slug: string): PostData | null {
  const contentDir = path.join(process.cwd(), 'content', brand);

  if (!fs.existsSync(contentDir)) return null;

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8');
    const { data, content } = matter(raw);

    if (data.slug === slug) {
      return {
        title: data.title,
        description: data.description,
        slug: data.slug,
        targetKeyword: data.targetKeyword,
        publishedAt: data.publishedAt,
        canonical: data.canonical,
        brand: data.brand,
        content,
      };
    }
  }

  return null;
}

function getAllPosts(): { brand: string; slug: string }[] {
  const contentRoot = path.join(process.cwd(), 'content');
  const results: { brand: string; slug: string }[] = [];

  for (const brand of ['brand-a', 'brand-b']) {
    const brandDir = path.join(contentRoot, brand);
    if (!fs.existsSync(brandDir)) continue;

    const files = fs.readdirSync(brandDir).filter((f) => f.endsWith('.mdx'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(brandDir, file), 'utf-8');
      const { data } = matter(raw);
      if (data.slug) {
        results.push({ brand, slug: data.slug });
      }
    }
  }

  return results;
}

// ─── Static Params ──────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllPosts();
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { brand: string; slug: string };
}): Promise<Metadata> {
  const post = getPost(params.brand, params.slug);
  if (!post) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: post.canonical,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `${siteUrl}/${post.brand}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: ['Multi-Brand SEO Agent'],
      tags: [post.targetKeyword],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

// ─── JSON-LD Schema ─────────────────────────────────────────────────────────

function generateJsonLd(post: PostData): object {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${siteUrl}/${post.brand}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    keywords: post.targetKeyword,
    author: {
      '@type': 'Organization',
      name: post.brand === 'brand-a' ? 'Modern Development Hub' : 'Technical SEO Authority',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Multi-Brand SEO Platform',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonical,
    },
  };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function BlogPostPage({
  params,
}: {
  params: { brand: string; slug: string };
}) {
  const post = getPost(params.brand, params.slug);

  if (!post) {
    notFound();
  }

  const accent = BRAND_ACCENTS[params.brand] || BRAND_ACCENTS['brand-a'];
  const jsonLd = generateJsonLd(post);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Post Header */}
        <header className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <a
              href={`/${params.brand}`}
              className={`${accent.textColor} text-sm font-medium hover:underline`}
            >
              ← Back to {params.brand === 'brand-a' ? 'Development Hub' : 'SEO Authority'}
            </a>
          </div>

          <span className={`tag ${accent.tagClass}`}>{params.brand}</span>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 mb-4 leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span className={`${accent.textColor} font-medium`}>
              {post.targetKeyword}
            </span>
          </div>

          <div className={`h-1 w-16 mt-8 rounded-full bg-gradient-to-r ${accent.gradient}`} />
        </header>

        {/* MDX Content */}
        <div className="prose animate-fade-in-up animate-delay-200">
          <MDXRemote source={post.content} />
        </div>

        {/* Post Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--border-color)] animate-fade-in-up animate-delay-300">
          <div className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">
                  This content was generated by the SEO Agent and verified by the deterministic engine.
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Schema validated · Heading hierarchy checked · Link integrity verified
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-400 text-sm">✓</span>
              </div>
            </div>
          </div>
        </footer>
      </article>
    </>
  );
}
