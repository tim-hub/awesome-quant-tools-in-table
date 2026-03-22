# Multi-Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eight improvements across frontend (CSV schema split, theme toggle, SEO, base path, padding fix), Node.js scripts (fetch commits, update readme), and docs/CI (contribution guide, CSV validation).

**Architecture:** Changes are independent and ordered by dependency — simple config/CSS fixes first, then schema changes that affect multiple files, then new scripts, then CI/docs. All frontend changes are in `web/`, scripts in `scripts/`, CI in `.github/workflows/`.

**Tech Stack:** React 18 + Vite + TypeScript + TanStack Table v8 + Shadcn/ui + Tailwind v4 — Node.js 20 ESM (`.mjs`) for scripts — GitHub Actions for CI

---

## File Map

**Modified:**
- `projects.csv` — add `language` column, rename subcategory part to `section`, remove old combined `section`
- `web/vite.config.ts` — change `base` from `/awesome-quant-tools-in-table/` to `/`
- `web/index.html` — add SEO meta tags
- `web/src/App.tsx` — update fetch URL, add ThemeToggle to header
- `web/src/types.ts` — add `language` field, keep `section` as subcategory only
- `web/src/index.css` — add light theme CSS vars, fix last commit header alignment
- `web/src/components/ToolsTable.tsx` — use `language` field directly, update column rendering
- `web/src/components/Filters.tsx` — filter by `language` dropdown (replaces generic section filter)
- `web/scripts/build-data.mjs` — read `language` and `section` separately
- `.github/workflows/fetch-commits.yml` — use `node scripts/fetch_last_commits.mjs`
- `README.md` — add contribution guide section + `<!-- TOOLS-START -->` / `<!-- TOOLS-END -->` markers

**Created:**
- `scripts/migrate_csv.mjs` — one-time CSV migration script
- `scripts/fetch_last_commits.mjs` — Node.js replacement for the bash script
- `scripts/update_readme.mjs` — regenerate README tools list from CSV
- `scripts/validate_csv.mjs` — CI CSV format validator
- `web/src/components/ThemeToggle.tsx` — dark/light toggle button
- `.github/workflows/validate-csv.yml` — PR validation for projects.csv changes

---

## Task 1: Fix Last Commit Header Padding (CSS only)

**Files:**
- Modify: `web/src/index.css:289`

The sort button has `padding: 10px 16px` and `width: 100%`, but its content is left-aligned (`display: flex`, no `justify-content`). The `<td>` data is right-aligned. Fix: make last column header content right-aligned.

- [ ] **Step 1: Update the CSS rule**

In `web/src/index.css`, replace line 289:
```css
/* before */
.data-table th:last-child .th-sort-btn { padding-right: 16px; }
```
with:
```css
.data-table th:last-child .th-sort-btn { justify-content: flex-end; }
```

- [ ] **Step 2: Verify visually**

Run `cd web && npm run dev` and open the site. The "Last Commit" header text should appear right-aligned in its column, matching the right-aligned date values below it.

- [ ] **Step 3: Commit**

```bash
git add web/src/index.css
git commit -m "fix: right-align last commit column header to match cell alignment"
```

---

## Task 2: Remove Base Path for Custom Domain

**Files:**
- Modify: `web/vite.config.ts:8`
- Modify: `web/src/App.tsx:14`

- [ ] **Step 1: Update vite.config.ts**

In `web/vite.config.ts`, change line 8:
```ts
// before
base: '/awesome-quant-tools-in-table/',
// after
base: '/',
```

- [ ] **Step 2: Update fetch URL in App.tsx**

In `web/src/App.tsx`, change line 14:
```ts
// before
fetch('/awesome-quant-tools-in-table/projects.json')
// after
fetch('/projects.json')
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd web && npm run build
```
Expected: build completes without errors. Check `web/dist/index.html` — asset paths should start with `/` not `/awesome-quant-tools-in-table/`.

- [ ] **Step 4: Commit**

```bash
git add web/vite.config.ts web/src/App.tsx
git commit -m "feat: remove GitHub Pages base path for custom domain"
```

---

## Task 3: Add SEO Metadata

**Files:**
- Modify: `web/index.html`

- [ ] **Step 1: Add meta tags to index.html**

In `web/index.html`, after `<title>Awesome Quant Tools</title>`, add:
```html
<title>Awesome Quant Tools | Quantitative Finance Library Index</title>
<meta name="description" content="A curated, searchable index of 400+ quantitative finance tools, libraries, and resources across Python, R, Julia, C++, and more." />
<meta property="og:title" content="Awesome Quant Tools" />
<meta property="og:description" content="A curated, searchable index of 400+ quantitative finance tools, libraries, and resources across Python, R, Julia, C++, and more." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://awesomequant.tools" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Awesome Quant Tools" />
<meta name="twitter:description" content="A curated, searchable index of 400+ quantitative finance tools." />
```

Also update the existing `<title>` tag (replace it, don't add a second one).

- [ ] **Step 2: Commit**

```bash
git add web/index.html
git commit -m "feat: add SEO meta tags for og and twitter cards"
```

---

## Task 4: Migrate CSV Schema (language + section split)

**Files:**
- Create: `scripts/migrate_csv.mjs`
- Modify: `projects.csv`

Current CSV header: `project,section,url,description,github,cran`
Where `section` is `"Python > Numerical Libraries & Data Structures"`.

New CSV header: `project,language,section,url,description,github,cran`
Where `language="Python"` and `section="Numerical Libraries & Data Structures"`.
Both nullable (empty string if no ` > ` separator).

- [ ] **Step 1: Write the migration script**

Create `scripts/migrate_csv.mjs`:
```js
#!/usr/bin/env node
// One-time migration: split 'section' column into 'language' + 'section'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = resolve(__dirname, '../projects.csv')

const raw = readFileSync(CSV_PATH, 'utf-8')
const lines = raw.split('\n')

// Validate header
const header = lines[0]
if (!header.startsWith('project,section,')) {
  console.error('ERROR: Unexpected header:', header)
  process.exit(1)
}

// Replace header
lines[0] = 'project,language,section,url,description,github,cran'

// Process data rows — split 'section' on ' > '
// CSV is simple enough: only description field is quoted
const result = [lines[0]]
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  // Parse: project,section,"description or plain",url,github,cran
  // We need to extract the second field (section) carefully
  // Strategy: find section by splitting on comma up to the quoted description
  // The format is: project,section,url,description,github,cran
  // description may be quoted. Find the section field (index 1).

  // Split only the first 2 commas to get project and section
  const firstComma = line.indexOf(',')
  const rest = line.slice(firstComma + 1)
  const secondComma = rest.indexOf(',')

  const project = line.slice(0, firstComma)
  const oldSection = rest.slice(0, secondComma)
  const remainder = rest.slice(secondComma + 1) // url,description,github,cran

  // Split oldSection on ' > '
  const gtIdx = oldSection.indexOf(' > ')
  let language = ''
  let section = ''
  if (gtIdx !== -1) {
    language = oldSection.slice(0, gtIdx).trim()
    section = oldSection.slice(gtIdx + 3).trim()
  } else {
    // No separator — treat whole thing as section, no language
    section = oldSection.trim()
  }

  result.push(`${project},${language},${section},${remainder}`)
}

writeFileSync(CSV_PATH, result.join('\n') + '\n', 'utf-8')
console.log(`Migrated ${result.length - 1} rows. New header: ${result[0]}`)
```

- [ ] **Step 2: Run the migration**

```bash
node scripts/migrate_csv.mjs
```
Expected output: `Migrated 447 rows. New header: project,language,section,url,description,github,cran`

- [ ] **Step 3: Verify the output**

```bash
head -5 projects.csv
```
Expected:
```
project,language,section,url,description,github,cran
numpy,Python,Numerical Libraries & Data Structures,https://www.numpy.org,...
scipy,Python,Numerical Libraries & Data Structures,https://www.scipy.org,...
```

- [ ] **Step 4: Commit**

```bash
git add projects.csv scripts/migrate_csv.mjs
git commit -m "feat: split CSV section into language + section columns"
```

---

## Task 5: Update Types, build-data, and ToolsTable for New Schema

**Files:**
- Modify: `web/src/types.ts`
- Modify: `web/scripts/build-data.mjs`
- Modify: `web/src/components/ToolsTable.tsx`
- Modify: `web/src/components/Filters.tsx`
- Modify: `web/src/App.tsx` (sections logic)

### 5a: Update TypeScript type

- [ ] **Step 1: Update `web/src/types.ts`**

Replace the `Project` interface:
```ts
export interface Project {
  project: string
  language: string      // e.g. "Python", "R", "Julia" — empty string if not applicable
  section: string       // e.g. "Numerical Libraries & Data Structures" — empty string if not applicable
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null
}
```

### 5b: Update build-data.mjs

- [ ] **Step 2: Update `web/scripts/build-data.mjs` merge block**

Find the `merged` array mapping (around line 34) and change to read `language` and `section` separately:
```js
const merged = projects.map(row => ({
  project:     row.project?.trim() ?? '',
  language:    row.language?.trim() ?? '',
  section:     row.section?.trim() ?? '',
  url:         row.url?.trim() ?? '',
  description: row.description?.trim() ?? '',
  github:      row.github?.trim() === 'True',
  cran:        row.cran?.trim() === 'True',
  last_commit: commitMap.get(row.url?.trim()) ?? null,
}))
```

### 5c: Update ToolsTable.tsx

- [ ] **Step 3: Update `web/src/components/ToolsTable.tsx`**

Key changes:
1. The `getLangStyle()` function: change parameter from `section: string` to `language: string`, remove the split logic:
```ts
function getLangStyle(language: string) {
  return { style: LANG_COLORS[language] ?? { bg: 'rgba(100,100,120,0.08)', text: '#5a6080', border: 'rgba(100,100,120,0.2)' } }
}
```

2. The `section` column accessor: change to use both `language` and `section` fields:
```tsx
columnHelper.accessor('section', {
  header: 'Section',
  cell: info => {
    const section = info.getValue()            // subcategory only
    const language = info.row.original.language
    const { style } = getLangStyle(language)
    return (
      <div className="cell-section">
        {language && (
          <span
            className="section-lang"
            style={{ background: style.bg, color: style.text, borderColor: style.border }}
          >
            {language}
          </span>
        )}
        {section && <span className="section-sub" title={section}>{section}</span>}
      </div>
    )
  },
}),
```

### 5d: Update Filters.tsx and App.tsx sections logic

The existing `sections` array in `App.tsx` was `[...new Set(projects.map(p => p.section))].sort()` where `section` was the combined string. Now we want the filter to work on `language`. Update:

- [ ] **Step 4: Update `web/src/App.tsx` sections useMemo**

```tsx
// Filter dropdown shows unique languages
const sections = useMemo(
  () => [...new Set(projects.map(p => p.language).filter(Boolean))].sort(),
  [projects]
)
```

- [ ] **Step 5: Update `web/src/components/ToolsTable.tsx` filtered useMemo**

```tsx
const filtered = useMemo(() => {
  if (selectedSections.length === 0) return data
  return data.filter(p => selectedSections.includes(p.language))
}, [data, selectedSections])
```

- [ ] **Step 6: Update `web/src/components/Filters.tsx` label**

Change the placeholder text from "Section" to "Language":
```tsx
const label = selectedSections.length === 0
  ? 'Language'
  : `${selectedSections.length} selected`
```
And change the popover search placeholder:
```tsx
<CommandInput placeholder="Filter languages..." />
```

- [ ] **Step 7: Run build to check for TypeScript errors**

```bash
cd web && npm run build
```
Expected: builds with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add web/src/types.ts web/scripts/build-data.mjs web/src/components/ToolsTable.tsx web/src/components/Filters.tsx web/src/App.tsx
git commit -m "feat: use language + section fields from updated CSV schema"
```

---

## Task 6: Dark/Light Theme Toggle

**Files:**
- Create: `web/src/components/ThemeToggle.tsx`
- Modify: `web/src/index.css`
- Modify: `web/src/App.tsx`

### Strategy

- Current `:root` defines dark colors. We keep dark as default.
- Add a `.light` class on `<html>` that overrides CSS variables to light values.
- `ThemeToggle` component toggles `document.documentElement.classList` between `''` and `'light'`, persists to `localStorage`.

### 6a: Add light theme CSS variables

- [ ] **Step 1: Add light mode CSS to `web/src/index.css`**

After the closing `}` of the `:root` block (line ~59), add:
```css
/* ─── Light Theme Overrides ─────────────────────────────────── */
html.light {
  --bg-base:        #f8f7f4;
  --bg-surface:     #f0ede8;
  --bg-hover:       rgba(180, 130, 40, 0.06);
  --bg-row-alt:     rgba(0, 0, 0, 0.02);

  --border-subtle:  #e2ddd6;
  --border-default: #d4cfc8;
  --border-strong:  #c0bab2;

  --text-primary:   #1a1814;
  --text-secondary: #7a7060;
  --text-dim:       #bdb9b2;
  --text-gold:      #9a6e1a;
  --text-teal:      #1a8a5a;
  --text-link:      #2a6aaa;

  /* Shadcn/ui variable overrides — light theme */
  --background:           #f8f7f4;
  --foreground:           #1a1814;
  --card:                 #f0ede8;
  --card-foreground:      #1a1814;
  --popover:              #edeae4;
  --popover-foreground:   #1a1814;
  --primary:              #9a6e1a;
  --primary-foreground:   #f8f7f4;
  --secondary:            #e2ddd6;
  --secondary-foreground: #1a1814;
  --muted:                #edeae4;
  --muted-foreground:     #7a7060;
  --accent:               #e2ddd6;
  --accent-foreground:    #1a1814;
  --border:               #d4cfc8;
  --input:                #d4cfc8;
  --ring:                 #9a6e1a;

  color-scheme: light;
}

html.light body { background: var(--bg-base); }
```

### 6b: Create ThemeToggle component

- [ ] **Step 2: Create `web/src/components/ThemeToggle.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('theme') === 'light'
  })

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }, [isLight])

  return (
    <button
      onClick={() => setIsLight(v => !v)}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        background: 'none',
        border: '1px solid var(--border-default)',
        borderRadius: '4px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        transition: 'color 0.15s, border-color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--text-gold)'
        e.currentTarget.style.borderColor = 'rgba(211, 167, 75, 0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-secondary)'
        e.currentTarget.style.borderColor = 'var(--border-default)'
      }}
    >
      {isLight ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  )
}
```

### 6c: Wire ThemeToggle into App header

- [ ] **Step 3: Update `web/src/App.tsx`**

Import `ThemeToggle` at the top:
```tsx
import { ThemeToggle } from './components/ThemeToggle'
```

Add it to the `header-meta` div alongside the GitHub link:
```tsx
<div className="header-meta">
  <a href="https://github.com/TradeInsight-Info/awesome-quant-tools-in-table" ...>
    {/* existing GitHub link */}
  </a>
  <ThemeToggle />
</div>
```

- [ ] **Step 4: Apply initial theme on page load (prevent flash)**

In `web/index.html`, add a blocking inline script in `<head>` before any other scripts:
```html
<script>
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') document.documentElement.classList.add('light');
  })();
</script>
```

- [ ] **Step 5: Run dev server and verify**

```bash
cd web && npm run dev
```
- Toggle should switch between dark (default) and light.
- Refresh should preserve selected theme (no flash).

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ThemeToggle.tsx web/src/index.css web/src/App.tsx web/index.html
git commit -m "feat: add dark/light theme toggle with localStorage persistence"
```

---

## Task 7: Replace fetch_last_commits.sh with Node.js MJS

**Files:**
- Create: `scripts/fetch_last_commits.mjs`
- Modify: `.github/workflows/fetch-commits.yml`

The new script must produce identical output to the bash script: a `last_commit_times.csv` with columns `url,last_commit`.

- [ ] **Step 1: Create `scripts/fetch_last_commits.mjs`**

```js
#!/usr/bin/env node
/**
 * Fetches last commit date for each GitHub repo listed in projects.csv.
 * Requires: GITHUB_TOKEN env var, Node.js 18+ (built-in fetch)
 * Output: last_commit_times.csv (url,last_commit)
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CSV_PATH = resolve(ROOT, 'projects.csv')
const OUTPUT_PATH = resolve(ROOT, 'last_commit_times.csv')
const BATCH_SIZE = 10
const DELAY_MS = 2000

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('ERROR: GITHUB_TOKEN is not set')
  process.exit(1)
}

// Parse CSV — simple: only description field is quoted
function parseCSV(raw) {
  const lines = raw.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const row = {}
    let i = 0, col = 0, inQuote = false, field = ''
    while (i <= line.length) {
      const ch = line[i]
      if (ch === '"') {
        inQuote = !inQuote
      } else if ((ch === ',' || i === line.length) && !inQuote) {
        row[headers[col]?.trim()] = field.trim()
        field = ''
        col++
      } else {
        field += (ch ?? '')
      }
      i++
    }
    return row
  })
}

// Extract owner/repo from GitHub URL
function extractOwnerRepo(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/)
  return m ? m[1] : null
}

// Fetch last commit date for a single repo
async function fetchLastCommit(ownerRepo, url) {
  const apiUrl = `https://api.github.com/repos/${ownerRepo}/commits?per_page=1`
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'awesome-quant-fetch',
    },
  })
  if (!res.ok) {
    console.warn(`WARN: ${res.status} for ${ownerRepo}`)
    return { url, last_commit: '' }
  }
  const data = await res.json()
  const date = data[0]?.commit?.committer?.date ?? data[0]?.commit?.author?.date ?? ''
  // Format as YYYY-MM-DD
  const formatted = date ? date.slice(0, 10) : ''
  return { url, last_commit: formatted }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8')
  const projects = parseCSV(raw)

  // Extract unique GitHub URLs
  const githubProjects = projects.filter(p => p.url?.startsWith('https://github.com/'))
  console.log(`Found ${githubProjects.length} GitHub URLs`)

  const results = []

  for (let i = 0; i < githubProjects.length; i += BATCH_SIZE) {
    const batch = githubProjects.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(githubProjects.length / BATCH_SIZE)}`)

    const batchResults = await Promise.all(
      batch.map(p => {
        const ownerRepo = extractOwnerRepo(p.url)
        if (!ownerRepo) {
          console.warn(`WARN: could not extract owner/repo from ${p.url}`)
          return Promise.resolve({ url: p.url, last_commit: '' })
        }
        return fetchLastCommit(ownerRepo, p.url)
      })
    )
    results.push(...batchResults)

    if (i + BATCH_SIZE < githubProjects.length) {
      await sleep(DELAY_MS)
    }
  }

  const csv = ['url,last_commit', ...results.map(r => `"${r.url}","${r.last_commit}"`)].join('\n') + '\n'
  writeFileSync(OUTPUT_PATH, csv, 'utf-8')
  console.log(`Wrote ${results.length} entries to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Update `.github/workflows/fetch-commits.yml`**

Add a Node.js setup step and change the run command:
```yaml
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Fetch last commit times
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/fetch_last_commits.mjs
```

- [ ] **Step 3: Verify script runs locally (optional — requires GITHUB_TOKEN)**

```bash
GITHUB_TOKEN=your_token node scripts/fetch_last_commits.mjs 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch_last_commits.mjs .github/workflows/fetch-commits.yml
git commit -m "feat: replace bash fetch script with Node.js mjs"
```

---

## Task 8: Add update_readme.mjs Script

**Files:**
- Create: `scripts/update_readme.mjs`
- Modify: `README.md` (add markers)

- [ ] **Step 1: Add markers to README.md**

Find the existing project list section in `README.md` and wrap it with markers. If the list doesn't exist yet, add the markers where the tool list should appear:
```markdown
<!-- TOOLS-START -->
<!-- TOOLS-END -->
```

These markers tell the script where to replace content.

- [ ] **Step 2: Create `scripts/update_readme.mjs`**

```js
#!/usr/bin/env node
/**
 * Regenerates the tools list in README.md from projects.csv.
 * Replaces content between <!-- TOOLS-START --> and <!-- TOOLS-END --> markers.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CSV_PATH = resolve(ROOT, 'projects.csv')
const README_PATH = resolve(ROOT, 'README.md')
const START_MARKER = '<!-- TOOLS-START -->'
const END_MARKER = '<!-- TOOLS-END -->'

function parseCSV(raw) {
  const lines = raw.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const row = {}
    let i = 0, col = 0, inQuote = false, field = ''
    while (i <= line.length) {
      const ch = line[i]
      if (ch === '"') {
        inQuote = !inQuote
      } else if ((ch === ',' || i === line.length) && !inQuote) {
        row[headers[col]?.trim()] = field.trim()
        field = ''
        col++
      } else {
        field += (ch ?? '')
      }
      i++
    }
    return row
  })
}

function generateToolsList(projects) {
  // Group by language then section
  const byLang = new Map()
  for (const p of projects) {
    const lang = p.language || 'Other'
    const sect = p.section || 'General'
    if (!byLang.has(lang)) byLang.set(lang, new Map())
    const langMap = byLang.get(lang)
    if (!langMap.has(sect)) langMap.set(sect, [])
    langMap.get(sect).push(p)
  }

  const lines = []
  for (const [lang, sections] of [...byLang.entries()].sort()) {
    lines.push(`## ${lang}`)
    lines.push('')
    for (const [sect, items] of [...sections.entries()].sort()) {
      lines.push(`### ${sect}`)
      lines.push('')
      for (const p of items) {
        const desc = p.description ? ` — ${p.description}` : ''
        lines.push(`- [${p.project}](${p.url})${desc}`)
      }
      lines.push('')
    }
  }
  return lines.join('\n')
}

function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8')
  const projects = parseCSV(raw)
  console.log(`Loaded ${projects.length} projects from CSV`)

  const readme = readFileSync(README_PATH, 'utf-8')
  const startIdx = readme.indexOf(START_MARKER)
  const endIdx = readme.indexOf(END_MARKER)

  if (startIdx === -1 || endIdx === -1) {
    console.error(`ERROR: Could not find ${START_MARKER} and ${END_MARKER} markers in README.md`)
    process.exit(1)
  }

  const before = readme.slice(0, startIdx + START_MARKER.length)
  const after = readme.slice(endIdx)
  const toolsList = generateToolsList(projects)
  const updated = `${before}\n\n${toolsList}\n${after}`

  writeFileSync(README_PATH, updated, 'utf-8')
  console.log(`Updated README.md with ${projects.length} tools`)
}

main()
```

- [ ] **Step 3: Run the script to populate the README**

```bash
node scripts/update_readme.mjs
```
Expected: `Updated README.md with 447 tools`

- [ ] **Step 4: Verify README output**

```bash
head -60 README.md
```
Check that the tools list is generated correctly under the markers.

- [ ] **Step 5: Commit**

```bash
git add scripts/update_readme.mjs README.md
git commit -m "feat: add update_readme.mjs script and populate tools list"
```

---

## Task 9: Contribution Guide + CSV Validation CI

**Files:**
- Modify: `README.md` (add Contributing section)
- Create: `scripts/validate_csv.mjs`
- Create: `.github/workflows/validate-csv.yml`

### 9a: Add Contributing section to README

- [ ] **Step 1: Add Contributing section to README.md**

Add above the `<!-- TOOLS-START -->` marker:
```markdown
## Contributing

To add a tool, edit `projects.csv`:

1. Append a new row at the **bottom** of the file (order doesn't matter)
2. Open a PR — CI will automatically validate the CSV format

### Column Reference

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| `project` | Yes | Plain text | `pandas` |
| `language` | No | Programming language | `Python` |
| `section` | No | Subcategory | `Data Analysis` |
| `url` | Yes | Full URL with https:// | `https://pandas.pydata.org` |
| `description` | No | Plain text (quote if contains commas) | `"Fast, powerful data analysis"` |
| `github` | No | `True` or `False` | `True` |
| `cran` | No | `True` or `False` | `False` |

**Example row:**
```csv
mylib,Python,Data Analysis,https://github.com/user/mylib,A great library,True,False
```

```

### 9b: Create CSV validator

- [ ] **Step 2: Create `scripts/validate_csv.mjs`**

```js
#!/usr/bin/env node
/**
 * Validates projects.csv format. Used in CI on PRs.
 * Exits 0 on success, 1 on failure.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = resolve(__dirname, '../projects.csv')

const REQUIRED_HEADERS = ['project', 'language', 'section', 'url', 'description', 'github', 'cran']
const BOOL_VALUES = new Set(['True', 'False', ''])

function parseCSVLine(line) {
  const fields = []
  let i = 0, inQuote = false, field = ''
  while (i <= line.length) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if ((ch === ',' || i === line.length) && !inQuote) {
      fields.push(field)
      field = ''
    } else {
      field += (ch ?? '')
    }
    i++
  }
  return fields
}

function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8')
  const lines = raw.trim().split('\n')
  const errors = []

  // Check header
  const headers = lines[0].split(',').map(h => h.trim())
  for (const req of REQUIRED_HEADERS) {
    if (!headers.includes(req)) {
      errors.push(`Missing required column: "${req}"`)
    }
  }
  if (errors.length) {
    console.error('CSV validation FAILED:')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  const colIdx = Object.fromEntries(headers.map((h, i) => [h, i]))

  // Check each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const lineNum = i + 1
    const fields = parseCSVLine(line)

    if (fields.length !== headers.length) {
      errors.push(`Line ${lineNum}: expected ${headers.length} columns, got ${fields.length}`)
      continue
    }

    const project = fields[colIdx.project]?.trim()
    const url = fields[colIdx.url]?.trim()
    const github = fields[colIdx.github]?.trim()
    const cran = fields[colIdx.cran]?.trim()

    if (!project) errors.push(`Line ${lineNum}: "project" is required`)
    if (!url) errors.push(`Line ${lineNum}: "url" is required`)
    if (url && !url.startsWith('http')) errors.push(`Line ${lineNum}: "url" must start with http: "${url}"`)
    if (!BOOL_VALUES.has(github)) errors.push(`Line ${lineNum}: "github" must be True, False, or empty — got "${github}"`)
    if (!BOOL_VALUES.has(cran)) errors.push(`Line ${lineNum}: "cran" must be True, False, or empty — got "${cran}"`)
  }

  if (errors.length) {
    console.error(`CSV validation FAILED (${errors.length} error${errors.length > 1 ? 's' : ''}):\n`)
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  console.log(`CSV validation PASSED: ${lines.length - 1} rows, ${headers.length} columns`)
}

main()
```

### 9c: Create CI workflow

- [ ] **Step 3: Create `.github/workflows/validate-csv.yml`**

```yaml
name: Validate CSV

on:
  pull_request:
    paths:
      - 'projects.csv'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate projects.csv
        run: node scripts/validate_csv.mjs
```

- [ ] **Step 4: Run validator locally to confirm it passes**

```bash
node scripts/validate_csv.mjs
```
Expected: `CSV validation PASSED: 447 rows, 7 columns`

- [ ] **Step 5: Commit**

```bash
git add README.md scripts/validate_csv.mjs .github/workflows/validate-csv.yml
git commit -m "feat: add CSV contribution guide, validator script, and CI workflow"
```

---

## Task 10: Build Data and Final Verification

- [ ] **Step 1: Run build-data to regenerate projects.json**

```bash
cd web && node scripts/build-data.mjs
```
Expected: `Wrote N projects to .../web/public/projects.json`

- [ ] **Step 2: Run full build**

```bash
cd web && npm run build
```
Expected: no TypeScript errors, build completes.

- [ ] **Step 3: Run dev server and smoke test**

```bash
cd web && npm run dev
```
Open in browser and verify:
- Table shows Language badge and Section text as separate elements
- Language filter dropdown shows language names (Python, R, Julia…)
- Theme toggle switches between dark and light
- Last Commit header is right-aligned matching the data cells
- Fetch URL works (no 404 for projects.json with new base path)

- [ ] **Step 4: Final commit (if any outstanding changes)**

```bash
git add -A
git status  # review before committing
git commit -m "chore: rebuild projects.json with new schema"
```
