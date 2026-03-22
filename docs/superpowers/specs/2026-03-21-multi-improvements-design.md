# Multi-Improvement Design Spec

**Date:** 2026-03-21

---

## Overview

Eight improvements across three groups: frontend enhancements, Node.js scripts, and docs/CI.

---

## Group A: Frontend (items 1, 2, 3, 4, 8)

### Item 1 — Split `section` column into `language` + `section`

**CSV schema change:**
- Current: `project,section,url,description,github,cran` where `section` is `"Python > Numerical Libraries & Data Structures"`
- New: `project,language,section,url,description,github,cran` where `language=Python` and `section=Numerical Libraries & Data Structures`
- Both `language` and `section` are nullable (empty string allowed)
- Migration: one-time script `scripts/migrate_csv.mjs` that reads old CSV and rewrites with new columns by splitting on ` > `

**TypeScript type update (`web/src/types.ts`):**
```ts
export interface Project {
  project: string
  language: string        // e.g. "Python", "R", "Julia" — nullable (empty string)
  section: string         // e.g. "Numerical Libraries & Data Structures" — nullable
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null
}
```

**`web/scripts/build-data.mjs` update:**
- Read `language` and `section` separately (not split at runtime)
- Pass through to merged JSON output

**`web/src/components/ToolsTable.tsx` update:**
- Language badge: use `language` field directly (no more string split)
- Section column shows `language` badge + `section` text
- The `getLangStyle()` function signature changes from `section: string` → `language: string`

### Item 2 — Dark/Light Theme Toggle

**Approach:** Custom theme toggle without extra dependencies. Toggle `class="dark"` on `<html>`, persist to `localStorage`.

- A `ThemeToggle` button component in `web/src/components/ThemeToggle.tsx`
- On mount: read `localStorage.getItem('theme')` or default to `'dark'`
- On click: toggle class on `document.documentElement`, write to localStorage
- CSS: add `:root` (light) variable overrides alongside existing `[data-theme="dark"]` or restructure so light is the default and `.dark` overrides

**CSS strategy:**
- Existing CSS uses dark as default (`:root` = dark colors). Refactor so:
  - `:root` = light mode variables
  - `.dark` = dark mode overrides (keeping all existing dark values)
- This makes Shadcn components work correctly in both modes

**Theme toggle button:** placed in the header (`App.tsx`), uses Sun/Moon icons from lucide-react.

### Item 3 — SEO Metadata

Update `web/index.html`:
```html
<title>Awesome Quant Tools | Quantitative Finance Library Index</title>
<meta name="description" content="A curated, searchable index of 400+ quantitative finance tools, libraries, and resources across Python, R, Julia, C++, and more." />
<meta property="og:title" content="Awesome Quant Tools" />
<meta property="og:description" content="A curated, searchable index of 400+ quantitative finance tools, libraries, and resources." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://awesomequant.tools" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Awesome Quant Tools" />
<meta name="twitter:description" content="A curated, searchable index of 400+ quantitative finance tools." />
```

### Item 4 — Remove Base Path for Custom Domain

**`web/vite.config.ts`:**
- Change `base: '/awesome-quant-tools-in-table/'` → `base: '/'`

**`web/src/App.tsx`:**
- Change fetch URL from `'/awesome-quant-tools-in-table/projects.json'` → `'/projects.json'`

No other changes needed.

### Item 8 — Fix Last Commit Header Padding

**Root cause:** The sort `<button>` inside `<th>` does not stretch to fill the full `<th>` width, so `padding-right` on the button doesn't produce visible right-edge spacing.

**Fix:** Add `width: 100%` to `.th-sort-btn` so it fills the `<th>`, then `padding-right: 16px` on the button works correctly. Also add `justify-content: flex-end` to push content to the right (since it's a flex container).

---

## Group B: Node.js Scripts (items 5, 6)

### Item 5 — Replace `scripts/fetch_last_commits.sh` with `scripts/fetch_last_commits.mjs`

**Behavior identical to bash script:**
- Reads `projects.csv` (from repo root)
- Extracts GitHub URLs (rows where `url` starts with `https://github.com/`)
- Batches requests to GitHub API (10 per batch, 2s delay between batches)
- Requires `GITHUB_TOKEN` env var; exits with error if missing
- Writes `last_commit_times.csv` with columns `url,last_commit`

**Implementation:**
```js
// Uses built-in Node.js fetch (v18+), no extra deps needed
// CSV parsing: simple split (no papaparse dep in scripts/)
// GitHub API: GET /repos/{owner}/{repo}/commits?per_page=1
```

**Update `.github/workflows/fetch-commits.yml`:**
- Change `run: bash scripts/fetch_last_commits.sh` → `run: node scripts/fetch_last_commits.mjs`
- Add `node-setup` step using `actions/setup-node@v4` with Node 20

### Item 6 — `scripts/update_readme.mjs`

**Purpose:** Regenerate the "Tools" section of `README.md` from `projects.csv`.

**Behavior:**
- Reads `projects.csv`
- Groups projects by `language` then `section`
- Generates markdown with language headers (`## Python`) and subsection headers (`### Numerical Libraries & Data Structures`)
- Each entry: `- [project name](url) — description`
- Replaces content in `README.md` between markers:
  ```
  <!-- TOOLS-START -->
  ...generated content...
  <!-- TOOLS-END -->
  ```
- Idempotent: safe to run multiple times

---

## Group C: Docs/CI (item 7)

### Item 7 — Contribution Guide + CSV Validation CI

**README contribution section (added above `<!-- TOOLS-START -->`):**
```markdown
## Contributing

To add or update a tool, edit `projects.csv`:
1. Append a new row at the bottom (order doesn't matter)
2. Required columns: `project`, `language`, `section`, `url`, `description`
3. Optional: `github` (True/False), `cran` (True/False)
4. Open a PR — CI will validate the CSV format automatically

Column format:
- `language`: Programming language (e.g. `Python`, `R`, `Julia`). Leave blank if not applicable.
- `section`: Subcategory within the language (e.g. `Backtesting`). Leave blank if not applicable.
- `url`: Full URL including `https://`
- `github`/`cran`: `True` or `False` only
```

**`.github/workflows/validate-csv.yml`:**
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
      - run: node scripts/validate_csv.mjs
```

**`scripts/validate_csv.mjs`:**
- Reads `projects.csv`
- Checks: required headers present, no empty `project` or `url`, `url` starts with `http`, `github`/`cran` are `True`/`False`/empty
- Exits with code 1 and clear error messages on failure
- Exits with code 0 and summary on success

---

## Execution Order

1. Item 4 (base path) — simplest, no dependencies
2. Item 8 (last commit padding) — CSS only
3. Item 3 (SEO) — HTML only
4. Item 1 (CSV split) — CSV migration + types + build-data + ToolsTable
5. Item 2 (theme toggle) — CSS + new component
6. Item 5 (fetch script mjs) — new script + workflow update
7. Item 6 (update readme script) — new script
8. Item 7 (contribution guide + CI) — README + new workflow + validate script
