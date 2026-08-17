# Multi-Brand SEO Agent

An AI-powered multi-brand content platform with **zero-trust deterministic verification**. Built with Next.js 14 (App Router), Groq AI (`groq/compound-mini`), and TypeScript.

> **Key Principle:** The verification engine never trusts LLM output — every generated post is independently validated against strict Zod schemas, MDX syntax rules, heading limits, duplicate checks, and link integrity before it can be merged or deployed.

Repository: [https://github.com/Hakaii1/multi-brand-seo-agent](https://github.com/Hakaii1/multi-brand-seo-agent)

---

## System Architecture

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    CLI / GitHub Actions                     │
 │  npx tsx scripts/generate-seo-post.ts brand-a <keyword>     │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                       ┌───────▼───────┐
                       │   Groq API    │  (groq/compound-mini)
                       │   or Mock     │  (offline fallback)
                       └───────┬───────┘
                               │ Returns MDX
                       ┌───────▼───────┐
                       │ Write Temp    │  content/{brand}/{slug}.mdx
                       │ Candidate     │
                       └───────┬───────┘
                               │
                       ┌───────▼──────────────────────┐
                       │  Deterministic Verification  │
                       │                              │
                       │  1. Pre-Check Keyword Guard  │
                       │  2. Zod Frontmatter Schema   │
                       │  3. Slug Kebab Regex         │
                       │  4. Max 1 H1 Tag Check       │
                       │  5. Link Integrity           │
                       │  6. MDX Syntax Safeguard     │
                       └───────┬──────────────┬───────┘
                               │              │
                    FAILED ────┘              └──── PASSED
                       │                               │
             ┌─────────▼──────────┐         ┌──────────▼──────────┐
             │ DELETE File from   │         │ KEEP File on Disk   │
             │ Disk & Exit (1)    │         │ & Create Draft PR   │
             └────────────────────┘         └──────────┬──────────┘
                                                       │
                                            ┌──────────▼──────────┐
                                            │ Next.js Frontend    │
                                            │ • Dynamic Metadata  │
                                            │ • JSON-LD Schema    │
                                            │ • OpenGraph Tags    │
                                            │ • Brand Themes      │
                                            └─────────────────────┘
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
# Edit .env and add your Groq API key (optional — mock mode works offline)
```

In `.env`:
```ini
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=groq/compound-mini
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Hakaii1/multi-brand-seo-agent
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the multi-brand landing page.

### 4. Generate Content (Latest CLI Syntax)

You can generate posts using either natural positional arguments or flag syntax:

```bash
# Natural Positional Arguments (Recommended)
npx tsx scripts/generate-seo-post.ts brand-a react server components performance
npx tsx scripts/generate-seo-post.ts brand-b core web vitals optimization

# Flag Syntax
npx tsx scripts/generate-seo-post.ts --brand brand-a --keyword "edge computing web architecture"
```

If `GROQ_API_KEY` is not present, it automatically uses the deterministic mock fallback so testing works offline.

### 5. Verify Content Files

```bash
# Verify all content files across all brands
npm run verify

# Verify a specific file directly
npx tsx scripts/verify-content.ts content/brand-a/modern-web-architecture.mdx
```

### 6. Run Test Suite & Build

```bash
# Run Vitest test suite (12 test cases)
npm test

# Run Next.js production static build
npm run build
```

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 14 (App Router, SSG)        |
| Language       | TypeScript (strict mode)            |
| Styling        | Tailwind CSS (Dual brand palettes)  |
| Content Engine | `gray-matter` + `next-mdx-remote`   |
| AI Engine      | Groq SDK (`groq/compound-mini`)     |
| Validation     | Zod + 6 Deterministic SEO Checks    |
| Testing        | Vitest                              |
| CI/CD          | GitHub Actions (Weekly cron schedule)|

---

## Verification Engine (6 Checks)

The verification engine (`scripts/verify-content.ts` & `scripts/generate-seo-post.ts`) enforces 6 independent checks:

1. **Pre-Check Keyword Guard:** Scans existing brand files before calling AI. Halts immediately if the keyword is already targeted to prevent cannibalization and token waste.
2. **Zod Frontmatter Validation:**
   - `title`: 20–65 characters (Google SERP limit)
   - `description`: 50–160 characters (Meta description limit)
   - `slug`: lowercase kebab-case (`^[a-z0-9-]+$`)
   - `publishedAt`: Valid ISO date string
   - `canonical`: Valid URL
   - `brand`: `'brand-a'` or `'brand-b'`
3. **Double-Quoted YAML Rules:** Ensures string fields in YAML are double-quoted so colons inside titles don't crash the YAML parser.
4. **Heading Hierarchy Enforcement:** Enforces a maximum of 1 `# H1` tag per page for clean SEO structure.
5. **Link Integrity Check:** Prevents cross-brand linking and checks internal markdown links against existing files.
6. **MDX Syntax Safeguard:** Scans for unescaped `<` characters (e.g., `< 200 MB`), converting them to `under 200 MB` to prevent MDX/JSX compilation errors.

---

## CI/CD & Automated Topic Queue

The GitHub Actions workflow (`.github/workflows/seo-agent-pr.yml`) automates content creation:

- **Schedule:** Every Monday at 09:00 UTC (`0 9 * * 1`)
- **10-Topic Rotation Queue:** Uses calendar week modulo (`WEEK % 10`) to select a new, un-targeted technical keyword each week automatically.
- **Manual Dispatch:** Supports manual runs from GitHub UI (`workflow_dispatch`) with custom brand and keyword inputs.
- **Human Approval:** Automatically opens a Draft Pull Request on GitHub for 1-click review and deployment.

---

## Project Directory Structure

```text
├── app/
│   ├── layout.tsx              # Root layout with nav and footer
│   ├── page.tsx                # Landing page displaying both brand showcases
│   ├── globals.css             # Dark theme, glassmorphism, brand color tokens
│   └── [brand]/
│       ├── layout.tsx          # Brand sub-layout
│       ├── page.tsx            # Brand blog index page
│       └── blog/[slug]/
│           └── page.tsx        # Dynamic post (MDX render, JSON-LD, OpenGraph)
├── content/
│   ├── brand-a/                # Brand A posts (Modern Engineering Hub)
│   └── brand-b/                # Brand B posts (Technical SEO Authority)
├── scripts/
│   ├── verify-content.ts       # Core 6-point verification engine
│   ├── generate-seo-post.ts    # Groq AI generation pipeline + pre-checks
│   └── fixtures/               # Test fixture files for Vitest
├── tests/
│   └── verification.test.ts    # Vitest test suite (12/12 passing)
├── .github/workflows/
│   └── seo-agent-pr.yml        # Weekly automated CI/CD workflow
└── README.md
```

---

## License

MIT
