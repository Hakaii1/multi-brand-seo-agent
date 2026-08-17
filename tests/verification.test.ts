import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  verifyContent,
  checkHeadingHierarchy,
  FrontmatterSchema,
} from '../scripts/verify-content';

const fixturesDir = path.join(__dirname, '..', 'scripts', 'fixtures');

// We use a temporary content dir for fixtures to avoid false-positive
// duplicate checks against the real content/ directory.
const fixtureContentDir = path.join(__dirname, '..', 'scripts', 'fixtures', '_content');

// Helper: run verifyContent against a fixture file with isolated content dir
function verifyFixture(filename: string) {
  const filePath = path.join(fixturesDir, filename);
  return verifyContent(filePath, fixtureContentDir);
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Deterministic Content Verification Engine', () => {
  // ── Valid Post ───────────────────────────────────────────────────────────

  describe('Valid MDX post', () => {
    it('should pass all verification checks', () => {
      const result = verifyFixture('valid-post.mdx');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── Title Too Long ──────────────────────────────────────────────────────

  describe('Title exceeding 65 characters', () => {
    it('should fail Zod schema validation', () => {
      const result = verifyFixture('invalid-title-long.mdx');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('title') || e.includes('Title'))).toBe(true);
    });
  });

  // ── Title Too Short ─────────────────────────────────────────────────────

  describe('Title under 20 characters', () => {
    it('should fail Zod schema validation', () => {
      const result = verifyFixture('invalid-title-short.mdx');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('title') || e.includes('Title'))).toBe(true);
    });
  });

  // ── Duplicate H1 Headings ───────────────────────────────────────────────

  describe('Duplicate H1 headings', () => {
    it('should fail heading hierarchy check', () => {
      const result = verifyFixture('invalid-duplicate-h1.mdx');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('H1'))).toBe(true);
    });

    it('should detect exact count of H1 tags via checkHeadingHierarchy', () => {
      const content = `# First Heading\nSome text\n# Second Heading\nMore text`;
      const errors = checkHeadingHierarchy(content);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('2 H1 headings');
    });

    it('should allow content with zero H1 tags', () => {
      const content = `## Subheading Only\nSome text\n### Another Subheading`;
      const errors = checkHeadingHierarchy(content);
      expect(errors).toHaveLength(0);
    });

    it('should allow content with exactly one H1 tag', () => {
      const content = `# Single Heading\nSome text\n## Subheading`;
      const errors = checkHeadingHierarchy(content);
      expect(errors).toHaveLength(0);
    });
  });

  // ── Invalid Slug Format ─────────────────────────────────────────────────

  describe('Invalid slug format', () => {
    it('should fail Zod regex validation', () => {
      const result = verifyFixture('invalid-slug.mdx');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((e) => e.includes('slug') || e.includes('Slug'))
      ).toBe(true);
    });
  });

  // ── Zod Schema Edge Cases ──────────────────────────────────────────────

  describe('Zod FrontmatterSchema', () => {
    it('should reject missing required fields', () => {
      const result = FrontmatterSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid brand values', () => {
      const result = FrontmatterSchema.safeParse({
        title: 'A Valid Title That Meets Length',
        description: 'A valid description that is long enough to meet the fifty character minimum.',
        slug: 'valid-slug',
        targetKeyword: 'test keyword',
        publishedAt: '2026-01-01T00:00:00.000Z',
        canonical: 'https://example.com/test',
        brand: 'brand-c', // Invalid brand
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('brand'))).toBe(true);
      }
    });

    it('should reject invalid canonical URL', () => {
      const result = FrontmatterSchema.safeParse({
        title: 'A Valid Title That Meets Length',
        description: 'A valid description that is long enough to meet the fifty character minimum.',
        slug: 'valid-slug',
        targetKeyword: 'test keyword',
        publishedAt: '2026-01-01T00:00:00.000Z',
        canonical: 'not-a-url',
        brand: 'brand-a',
      });
      expect(result.success).toBe(false);
    });

    it('should accept a fully valid frontmatter object', () => {
      const result = FrontmatterSchema.safeParse({
        title: 'A Valid Title That Meets Length',
        description: 'A valid description that is long enough to meet the fifty character minimum.',
        slug: 'valid-slug',
        targetKeyword: 'test keyword',
        publishedAt: '2026-01-01T00:00:00.000Z',
        canonical: 'https://example.com/test',
        brand: 'brand-a',
      });
      expect(result.success).toBe(true);
    });
  });
});
