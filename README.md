# Multi-Brand SEO Agent

An AI-powered multi-brand content platform with **deterministic verification**. Built with Next.js (App Router), Groq (Llama 3), and TypeScript.

> **Key Principle:** The verification engine never trusts LLM output — every generated post is independently validated against strict Zod schemas, heading rules, duplicate checks, and link integrity before it can be merged.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI / GitHub Actions                     │
│                                                             │
│  npm run generate -- --brand brand-a --keyword "keyword"    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Groq API   │  (llama-3.3-70b-versatile)
                    │  or Mock    │  (fallback if no API key)
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────────────┐
                    │  Candidate MDX File          │
                    │  content/{brand}/{slug}.mdx  │
                    └──────┬──────────────────────┘
                           │
              ┌────────────▼────────────────┐
              │  Verification Engine         │
              │                              │
              │  ✓ Zod schema validation     │
              │  ✓ Duplicate/cannibalization │
              │  ✓ Heading hierarchy (≤1 H1) │
              │  ✓ Link integrity            │
              └────────────┬────────────────┘
                           │
              ┌────────────▼────────────────┐
              │  Pass → Keep file            │
              │  Fail → Delete + exit(1)     │
              └────────────┬────────────────┘
                           │
              ┌────────────▼────────────────┐
              │  Next.js Multi-Brand Site    │
              │                              │
              │  /brand-a/blog/{slug}        │
              │  /brand-b/blog/{slug}        │
              │                              │
              │  • Dynamic metadata          │
              │  • OpenGraph tags            │
              │  • JSON-LD schema            │
              │  • Canonical URLs            │
              └─────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env and add your Groq API key (optional — mock mode works without it)
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the multi-brand landing page.

### 4. Generate Content

```bash
# With Groq API key (live mode)
npm run generate -- --brand brand-a --keyword "react server components"

# Without API key (mock mode — works offline)
npm run generate -- --brand brand-b --keyword "core web vitals optimization"
```

### 5. Verify Existing Content

```bash
# Verify all content files
npm run verify

# Verify a specific file
npx tsx scripts/verify-content.ts content/brand-a/modern-web-architecture.mdx
```

### 6. Run Tests

```bash
npm test
```

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 14 (App Router)             |
| Language       | TypeScript (strict mode)            |
| Styling        | Tailwind CSS                        |
| Content        | MDX via `gray-matter` + `next-mdx-remote` |
| AI             | Groq SDK (`llama-3.3-70b-versatile`) |
| Validation     | Zod (schema), custom SEO checks     |
| Testing        | Vitest                              |
| CI/CD          | GitHub Actions                      |

---

## Verification Engine

The verification engine (`scripts/verify-content.ts`) performs 4 independent checks:

### 1. Zod Schema Validation

Validates frontmatter against strict constraints:

- `title`: 20–65 characters
- `description`: 50–160 characters
- `slug`: lowercase kebab-case (`^[a-z0-9-]+$`)
- `targetKeyword`: non-empty string
- `publishedAt`: valid ISO 8601 date
- `canonical`: valid URL
- `brand`: `'brand-a'` or `'brand-b'`

### 2. Duplicate / Cannibalization Check

Scans the brand's content directory and rejects if:
- A file with the same slug already exists
- Another post targets the same keyword

### 3. Heading Hierarchy

Rejects content with more than one `# H1` heading — SEO best practice requires a single H1 per page.

### 4. Link Integrity

Validates internal markdown links:
- No cross-brand linking (e.g., brand-a post linking to `/brand-b/...`)
- No broken internal links to non-existent slugs

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/seo-agent-pr.yml`) supports:

- **Scheduled runs**: Weekly on Monday at 09:00 UTC
- **Manual dispatch**: Trigger from the GitHub UI with custom brand and keyword inputs

### Pipeline Steps

1. Checkout & install dependencies
2. Generate content via Groq AI (or mock fallback)
3. Run verification engine on all content
4. Execute Vitest test suite
5. Create a draft PR for human review

### Setup

Add `GROQ_API_KEY` as a repository secret in **Settings → Secrets → Actions**.

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with nav and footer
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles and brand themes
│   └── [brand]/
│       ├── layout.tsx          # Brand-specific sub-layout
│       ├── page.tsx            # Blog index page
│       └── blog/
│           └── [slug]/
│               └── page.tsx    # Dynamic post with JSON-LD & OG tags
├── content/
│   ├── brand-a/                # Brand A content directory
│   └── brand-b/                # Brand B content directory
├── scripts/
│   ├── verify-content.ts       # Deterministic verification engine
│   ├── generate-seo-post.ts    # Groq AI generation pipeline
│   └── fixtures/               # Test fixture MDX files
├── tests/
│   └── verification.test.ts    # Vitest test suite
├── .github/
│   └── workflows/
│       └── seo-agent-pr.yml    # CI/CD workflow
└── README.md
```

---

## License

MIT
