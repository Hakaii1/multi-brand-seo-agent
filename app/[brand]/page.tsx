import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// ─── Brand Configuration ────────────────────────────────────────────────────

const BRANDS: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    gradient: string;
    tagClass: string;
    accentColor: string;
    hoverColor: string;
  }
> = {
  'brand-a': {
    name: 'Modern Development Hub',
    tagline: 'Engineering excellence through modern web architecture',
    description:
      'Explore deep dives into modern web architecture, frontend frameworks, and engineering best practices for technical decision-makers.',
    gradient: 'from-indigo-600 via-indigo-500 to-purple-500',
    tagClass: 'tag-brand-a',
    accentColor: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-300',
  },
  'brand-b': {
    name: 'Technical SEO Authority',
    tagline: 'Data-driven strategies for organic growth',
    description:
      'Actionable SEO strategies, technical optimization guides, and data-driven approaches to organic growth for marketers and growth engineers.',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    tagClass: 'tag-brand-b',
    accentColor: 'text-emerald-400',
    hoverColor: 'group-hover:text-emerald-300',
  },
};

// ─── Content Loader ─────────────────────────────────────────────────────────

interface PostMeta {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  targetKeyword: string;
}

function getPostsForBrand(brand: string): PostMeta[] {
  const contentDir = path.join(process.cwd(), 'content', brand);

  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx'));

  return files
    .map((file) => {
      try {
        const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8');
        const { data } = matter(raw);
        if (!data || !data.title || !data.slug) return null;
        return {
          title: data.title as string,
          description: (data.description || '') as string,
          slug: data.slug as string,
          publishedAt: (data.publishedAt || new Date().toISOString()) as string,
          targetKeyword: (data.targetKeyword || '') as string,
        };
      } catch {
        return null;
      }
    })
    .filter((post): post is PostMeta => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { brand: string };
}): Promise<Metadata> {
  const brand = BRANDS[params.brand];
  if (!brand) return {};

  return {
    title: brand.name,
    description: brand.description,
    openGraph: {
      title: brand.name,
      description: brand.description,
      type: 'website',
      url: `/${params.brand}`,
    },
  };
}

export function generateStaticParams() {
  return [{ brand: 'brand-a' }, { brand: 'brand-b' }];
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function BrandIndexPage({
  params,
}: {
  params: { brand: string };
}) {
  const config = BRANDS[params.brand];

  if (!config) {
    notFound();
  }

  const posts = getPostsForBrand(params.brand);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Brand Header */}
      <div className="mb-16 animate-fade-in-up">
        <span className={`tag ${config.tagClass} mb-4`}>{params.brand}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 mb-3">
          {config.name}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          {config.tagline}
        </p>
        <div className={`h-1 w-20 mt-6 rounded-full bg-gradient-to-r ${config.gradient}`} />
      </div>

      {/* Post Listing */}
      {posts.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in-up animate-delay-200">
          <p className="text-[var(--text-muted)] text-lg mb-2">No articles yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Run the content generator to create AI-powered posts for this brand.
          </p>
          <code className="block mt-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-lg px-4 py-2 inline-block">
            npm run generate -- --brand {params.brand} --keyword &quot;your keyword&quot;
          </code>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <a
              key={post.slug}
              href={`/${params.brand}/blog/${post.slug}`}
              className={`group glass-card block p-6 animate-fade-in-up`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2
                    className={`text-lg font-semibold text-[var(--text-primary)] ${config.hoverColor} transition-colors duration-200 mb-2`}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </div>
                <span
                  className={`${config.accentColor} text-lg flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300`}
                >
                  →
                </span>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span className="italic">{post.targetKeyword}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
