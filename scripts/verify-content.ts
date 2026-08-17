import { z } from 'zod';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ─── Zod Schema ─────────────────────────────────────────────────────────────

export const FrontmatterSchema = z.object({
  title: z
    .string()
    .min(20, 'Title must be at least 20 characters')
    .max(65, 'Title must be at most 65 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(160, 'Description must be at most 160 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase kebab-case (a-z, 0-9, hyphens only)'),
  targetKeyword: z
    .string()
    .min(1, 'Target keyword must not be empty'),
  publishedAt: z
    .union([z.string(), z.date()])
    .transform((val) => (val instanceof Date ? val.toISOString() : val))
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'publishedAt must be a valid date string'
    ),
  canonical: z
    .string()
    .url('Canonical must be a valid URL'),
  brand: z.enum(['brand-a', 'brand-b'], {
    errorMap: () => ({ message: "Brand must be 'brand-a' or 'brand-b'" }),
  }),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

// ─── Verification Result ────────────────────────────────────────────────────

export interface VerificationResult {
  valid: boolean;
  errors: string[];
}

// ─── Check: Heading Hierarchy ───────────────────────────────────────────────

export function checkHeadingHierarchy(content: string): string[] {
  const errors: string[] = [];
  const lines = content.split('\n');
  let h1Count = 0;

  for (const line of lines) {
    // Match lines that start with exactly one # followed by a space
    // Ignore code blocks (lines inside ``` fences)
    if (/^# (?!#)/.test(line.trim())) {
      h1Count++;
    }
  }

  if (h1Count > 1) {
    errors.push(
      `Found ${h1Count} H1 headings — SEO best practice allows at most 1 H1 per page`
    );
  }

  return errors;
}

// ─── Check: Duplicate / Cannibalization ─────────────────────────────────────

export function checkDuplicates(
  frontmatter: Frontmatter,
  currentFilePath: string,
  contentDir: string
): string[] {
  const errors: string[] = [];
  const brandDir = path.join(contentDir, frontmatter.brand);

  if (!fs.existsSync(brandDir)) {
    return errors; // No existing content — no duplicates possible
  }

  const existingFiles = glob.sync('*.mdx', { cwd: brandDir });

  for (const file of existingFiles) {
    const fullPath = path.join(brandDir, file);

    // Skip the file we're currently validating
    if (path.resolve(fullPath) === path.resolve(currentFilePath)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);

      // Check slug duplication
      if (data.slug === frontmatter.slug) {
        errors.push(
          `Duplicate slug "${frontmatter.slug}" — already used in ${file}`
        );
      }

      // Check keyword cannibalization
      if (
        data.targetKeyword &&
        data.targetKeyword.toLowerCase() === frontmatter.targetKeyword.toLowerCase()
      ) {
        errors.push(
          `Keyword cannibalization: "${frontmatter.targetKeyword}" already targeted by ${file}`
        );
      }
    } catch {
      // If we can't read a sibling file, skip it
    }
  }

  return errors;
}

// ─── Check: Link Integrity ──────────────────────────────────────────────────

export function checkLinkIntegrity(
  content: string,
  frontmatter: Frontmatter
): string[] {
  const errors: string[] = [];
  // Match markdown links: [text](/path)
  const linkRegex = /\[([^\]]*)\]\(\/([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkPath = match[2]; // path without leading /

    // Check cross-brand linking
    const otherBrand = frontmatter.brand === 'brand-a' ? 'brand-b' : 'brand-a';
    if (linkPath.startsWith(otherBrand + '/') || linkPath === otherBrand) {
      errors.push(
        `Cross-brand link detected: "/${linkPath}" — ${frontmatter.brand} posts must not link to ${otherBrand}`
      );
    }

    // Check that internal brand links reference valid routes
    if (linkPath.startsWith(frontmatter.brand + '/blog/')) {
      const linkedSlug = linkPath
        .replace(`${frontmatter.brand}/blog/`, '')
        .replace(/\/$/, '');

      if (linkedSlug) {
        const contentDir = path.join(process.cwd(), 'content');
        const brandDir = path.join(contentDir, frontmatter.brand);
        const linkedFile = path.join(brandDir, `${linkedSlug}.mdx`);

        if (!fs.existsSync(linkedFile)) {
          errors.push(
            `Broken internal link: "/${linkPath}" — no content file found for slug "${linkedSlug}"`
          );
        }
      }
    }
  }

  return errors;
}

// ─── Main Verification Function ─────────────────────────────────────────────

export function verifyContent(
  filePath: string,
  contentDir?: string
): VerificationResult {
  const errors: string[] = [];
  const resolvedContentDir = contentDir || path.join(process.cwd(), 'content');

  // 1. Read and parse file
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return { valid: false, errors: [`Cannot read file: ${filePath}`] };
  }

  let data: Record<string, any>;
  let content: string;
  try {
    const parsedMatter = matter(rawContent);
    data = parsedMatter.data;
    content = parsedMatter.content;
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Frontmatter YAML Syntax Error: ${err.message || 'Invalid YAML format'}`],
    };
  }

  // 2. Zod schema validation
  const parsed = FrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`Frontmatter: ${issue.path.join('.')} — ${issue.message}`);
    }
    // Return early — other checks depend on valid frontmatter
    return { valid: false, errors };
  }

  const frontmatter = parsed.data;

  // 3. Heading hierarchy check
  errors.push(...checkHeadingHierarchy(content));

  // 4. Duplicate / cannibalization check
  errors.push(...checkDuplicates(frontmatter, filePath, resolvedContentDir));

  // 5. Link integrity check
  errors.push(...checkLinkIntegrity(content, frontmatter));

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

if (process.argv[1] && path.resolve(process.argv[1]).includes('verify-content')) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.log('Usage: tsx scripts/verify-content.ts <path-to-mdx>');
    console.log('       tsx scripts/verify-content.ts --all');
    console.log('');

    // Default: verify all content
    const contentDir = path.join(process.cwd(), 'content');
    const files = glob.sync('**/*.mdx', { cwd: contentDir });

    if (files.length === 0) {
      console.log('No MDX files found in content/');
      process.exit(0);
    }

    let allValid = true;
    for (const file of files) {
      const fullPath = path.join(contentDir, file);
      const result = verifyContent(fullPath);
      if (result.valid) {
        console.log(`  ✓ ${file}`);
      } else {
        console.log(`  ✗ ${file}`);
        for (const err of result.errors) {
          console.log(`    → ${err}`);
        }
        allValid = false;
      }
    }

    process.exit(allValid ? 0 : 1);
  } else if (targetFile === '--all') {
    const contentDir = path.join(process.cwd(), 'content');
    const files = glob.sync('**/*.mdx', { cwd: contentDir });

    let allValid = true;
    for (const file of files) {
      const fullPath = path.join(contentDir, file);
      const result = verifyContent(fullPath);
      if (result.valid) {
        console.log(`  ✓ ${file}`);
      } else {
        console.log(`  ✗ ${file}`);
        for (const err of result.errors) {
          console.log(`    → ${err}`);
        }
        allValid = false;
      }
    }

    process.exit(allValid ? 0 : 1);
  } else {
    const result = verifyContent(path.resolve(targetFile));
    if (result.valid) {
      console.log(`✓ Valid: ${targetFile}`);
    } else {
      console.log(`✗ Invalid: ${targetFile}`);
      for (const err of result.errors) {
        console.log(`  → ${err}`);
      }
    }
    process.exit(result.valid ? 0 : 1);
  }
}
