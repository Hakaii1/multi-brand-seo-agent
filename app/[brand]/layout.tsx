import { notFound } from 'next/navigation';

const BRAND_CONFIG: Record<string, { name: string; tagline: string; accentClass: string }> = {
  'brand-a': {
    name: 'Modern Development Hub',
    tagline: 'Deep dives into modern web architecture and engineering best practices',
    accentClass: 'brand-a',
  },
  'brand-b': {
    name: 'Technical SEO Authority',
    tagline: 'Actionable SEO strategies and data-driven approaches to organic growth',
    accentClass: 'brand-b',
  },
};

export default function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { brand: string };
}) {
  const config = BRAND_CONFIG[params.brand];

  if (!config) {
    notFound();
  }

  return <div className={config.accentClass}>{children}</div>;
}
