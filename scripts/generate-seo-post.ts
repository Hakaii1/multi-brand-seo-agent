import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { verifyContent } from './verify-content';

// ─── Environment Loader ─────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}
loadEnv();

// ─── CLI Argument Parsing ───────────────────────────────────────────────────

function parseArgs(): { brand: string; keyword: string } {
  const args = process.argv.slice(2);
  let brand = 'brand-a';
  let keyword = 'web development best practices';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--brand' && args[i + 1]) {
      brand = args[i + 1];
      i++;
    } else if (args[i] === '--keyword' && args[i + 1]) {
      keyword = args[i + 1];
      i++;
    }
  }

  if (!['brand-a', 'brand-b'].includes(brand)) {
    console.error(`Invalid brand "${brand}". Must be "brand-a" or "brand-b".`);
    process.exit(1);
  }

  return { brand, keyword };
}

// ─── Mock Response Fallback ─────────────────────────────────────────────────

function generateMockResponse(brand: string, keyword: string): string {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

  const title = `The Complete Guide to ${keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')}`;

  // Ensure title length is between 20-65 chars
  const safeTitle = title.length > 65 ? title.slice(0, 62) + '...' : title.length < 20 ? title + ' — A Deep Dive' : title;

  const description = `Explore the essential strategies and techniques for ${keyword}. This comprehensive guide covers everything you need to know for modern web development.`;
  const safeDescription = description.length > 160 ? description.slice(0, 157) + '...' : description;

  return `---
title: "${safeTitle}"
description: "${safeDescription}"
slug: "${slug}"
targetKeyword: "${keyword}"
publishedAt: "${today}"
canonical: "https://example.com/${brand}/blog/${slug}"
brand: "${brand}"
---

## Why ${keyword.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Matters

In today's rapidly evolving digital landscape, understanding ${keyword} is crucial for building successful web applications. This guide explores the key principles and actionable strategies that drive results.

## Core Principles

When approaching ${keyword}, there are several fundamental principles to keep in mind. First, always prioritize user experience alongside technical implementation. Second, ensure that your approach is scalable and maintainable over time.

### Performance Considerations

Performance is non-negotiable in modern web development. Every millisecond of load time impacts user engagement and search engine rankings. Implement lazy loading, code splitting, and efficient caching strategies to stay ahead.

### Best Practices for Implementation

Start with a solid foundation. Use TypeScript for type safety, implement comprehensive testing, and follow established design patterns. These practices compound over time, reducing technical debt and improving team velocity.

## Measuring Success

Track your progress with clear metrics. Monitor Core Web Vitals, user engagement rates, and conversion funnels to ensure your ${keyword} strategy delivers measurable business value.

## Conclusion

Mastering ${keyword} requires continuous learning and adaptation. By following the principles outlined in this guide, you'll be well-positioned to build exceptional web experiences that rank well and convert visitors into customers.
`;
}

// ─── System Prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(brand: string, keyword: string): string {
  return `You are an expert SEO content writer. Generate a complete MDX blog post optimized for the keyword "${keyword}".

CRITICAL: Your response must be ONLY the raw MDX content. Do not wrap it in code blocks or add any explanation.

The post MUST begin with valid YAML frontmatter between --- delimiters containing EXACTLY these fields:
- title: A compelling, SEO-optimized title (MUST be between 20-65 characters)
- description: Meta description (MUST be between 50-160 characters)
- slug: URL slug in lowercase kebab-case matching regex ^[a-z0-9-]+$
- targetKeyword: "${keyword}"
- publishedAt: Today's date as ISO 8601 string (e.g., "2026-08-15T00:00:00.000Z")
- canonical: "https://example.com/${brand}/blog/{slug}"
- brand: "${brand}"

Content requirements:
- Use ONLY H2 (##) and H3 (###) headings — do NOT use H1 (#) headings
- Write 300+ words of substantive, original content
- Include actionable insights, not just theory
- Do not include any internal links
- Make it informative and engaging for a technical audience
- Use proper markdown formatting`;
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { brand, keyword } = parseArgs();
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'groq/compound';

  console.log(`\n🚀 SEO Content Generator`);
  console.log(`   Brand:   ${brand}`);
  console.log(`   Keyword: "${keyword}"`);
  console.log(`   Model:   ${apiKey ? model : 'MOCK (no GROQ_API_KEY)'}\n`);

  let mdxContent: string;

  if (!apiKey) {
    console.log('⚠  No GROQ_API_KEY found — using mock fallback\n');
    mdxContent = generateMockResponse(brand, keyword);
  } else {
    console.log('🤖 Calling Groq API...\n');
    const groq = new Groq({ apiKey });

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(brand, keyword),
          },
          {
            role: 'user',
            content: `Write an SEO-optimized blog post about "${keyword}" for the ${brand} brand.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      mdxContent = completion.choices[0]?.message?.content || '';

      if (!mdxContent.trim()) {
        console.error('❌ Empty response from Groq API');
        process.exit(1);
      }

      // Strip code block wrappers if the LLM added them
      mdxContent = mdxContent
        .replace(/^```(?:mdx|markdown|md)?\n/i, '')
        .replace(/\n```\s*$/, '');
    } catch (error) {
      console.error('❌ Groq API error:', error);
      process.exit(1);
    }
  }

  // Derive slug from frontmatter
  const slugMatch = mdxContent.match(/^slug:\s*"?([^"\n]+)"?\s*$/m);
  const slug = slugMatch
    ? slugMatch[1].trim()
    : keyword
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

  // Write candidate file
  const contentDir = path.join(process.cwd(), 'content');
  const brandDir = path.join(contentDir, brand);
  fs.mkdirSync(brandDir, { recursive: true });

  const filePath = path.join(brandDir, `${slug}.mdx`);
  fs.writeFileSync(filePath, mdxContent, 'utf-8');
  console.log(`📝 Candidate written: ${path.relative(process.cwd(), filePath)}\n`);

  // Run verification
  console.log('🔍 Running verification...\n');
  const result = verifyContent(filePath);

  if (result.valid) {
    console.log('✅ Verification passed — content is ready for review\n');
    process.exit(0);
  } else {
    console.log('❌ Verification FAILED:\n');
    for (const err of result.errors) {
      console.log(`   → ${err}`);
    }
    console.log('');

    // Clean up invalid file
    fs.unlinkSync(filePath);
    console.log(`🗑  Deleted invalid candidate: ${path.relative(process.cwd(), filePath)}\n`);
    process.exit(1);
  }
}

main();
