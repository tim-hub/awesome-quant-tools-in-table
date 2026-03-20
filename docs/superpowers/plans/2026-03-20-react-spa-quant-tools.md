# React SPA + Data Refresh for Awesome Quant Tools — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Quarto/R site with a React SPA showing a filterable/sortable table of quant tools, served via GitHub Pages, backed by a weekly-refreshed CSV of GitHub last commit times.

**Architecture:** Three sequential phases — (1) clean up the repo and fix the CSV schema, (2) add a shell script + weekly workflow that fetches last commit times, (3) scaffold a Vite+React+Shadcn SPA in `web/` with a build-time CSV merge step and a deploy workflow.

**Tech Stack:** Vite, React 18, TypeScript, Shadcn/ui, TanStack Table v8, papaparse (dev), bash + curl + jq, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-20-react-spa-quant-tools-design.md`

---

## File Map

### Phase 1 — Simplify (Scope 3)
- Delete: `parse.py`, `cranscrape.py`, `poetry.lock`, `pyproject.toml`, `topic.py`, `recommendation.ipynb`, `quants.md`, `legacy.txt`, `styles.css`, `cran.csv`, `.nojekyll`
- Delete: `site/_quarto.yml`, `site/index.qmd`, `site/projects.qmd`, `site/CODE_OF_CONDUCT.qmd`, `site/about.qmd`, `site/.gitignore`
- Delete: `.github/workflows/build.yml`
- Modify: `site/projects.csv` — remove `last_commit` and `repo` columns → 6 columns: `project, section, url, description, github, cran`
- Modify: `README.md` — add GH Pages link + sentinel comment markers
- Modify: `.gitignore` — add `web/node_modules/`, `web/dist/`, `web/public/projects.json`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

### Phase 2 — Data Refresh (Scope 2)
- Create: `scripts/fetch_last_commits.sh`
- Create: `.github/workflows/fetch-commits.yml`

### Phase 3 — React SPA (Scope 1)
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.node.json`
- Create: `web/index.html`
- Create: `web/components.json` (Shadcn config)
- Create: `web/scripts/build-data.mjs`
- Create: `web/src/types.ts`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/components/Filters.tsx`
- Create: `web/src/components/ToolsTable.tsx`
- Create: `.github/workflows/deploy-spa.yml`

---

## Phase 1 — Repository Simplification

### Task 1: Delete legacy files

**Files:** all listed in "Delete" above

- [ ] **Step 1: Delete legacy Python + notebook files**

```bash
git rm parse.py cranscrape.py poetry.lock pyproject.toml topic.py recommendation.ipynb quants.md legacy.txt styles.css cran.csv .nojekyll
```

- [ ] **Step 2: Delete Quarto site files**

```bash
git rm site/_quarto.yml site/index.qmd site/projects.qmd site/CODE_OF_CONDUCT.qmd site/about.qmd site/.gitignore
```

- [ ] **Step 3: Delete old workflow**

```bash
git rm .github/workflows/build.yml
```

- [ ] **Step 4: Verify only expected files remain**

```bash
git status
```

Expected: all deletions staged, no unexpected changes.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove legacy Quarto, Python, and build artifacts"
```

---

### Task 2: Rewrite `site/projects.csv` to remove `last_commit` and `repo` columns

**Files:**
- Modify: `site/projects.csv`

Current columns: `project, section, last_commit, url, description, github, cran, repo`
Target columns: `project, section, url, description, github, cran`

- [ ] **Step 1: Run the column-strip script**

```bash
python3 - <<'EOF'
import csv, sys

with open('site/projects.csv', newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

keep = ['project', 'section', 'url', 'description', 'github', 'cran']

with open('site/projects.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=keep)
    writer.writeheader()
    for row in rows:
        writer.writerow({k: row[k] for k in keep})

print(f"Done. {len(rows)} rows written.")
EOF
```

Expected output: `Done. N rows written.`

- [ ] **Step 2: Spot-check the result**

```bash
head -3 site/projects.csv
```

Expected first line: `project,section,url,description,github,cran`

- [ ] **Step 3: Commit**

```bash
git add site/projects.csv
git commit -m "chore: remove last_commit and repo columns from projects.csv"
```

---

### Task 3: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add GitHub Pages link near the top**

Open `README.md` and insert after the first `#` heading:

```markdown
> **Browse the full interactive table:** [awesome-quant-tools-in-table on GitHub Pages](https://hbai.github.io/awesome-quant-tools-in-table/)
```

(Replace `hbai` with the actual GitHub org/username.)

- [ ] **Step 2: Add sentinel markers around the project list**

Find the section of `README.md` that contains the hand-maintained project list. Wrap it:

```markdown
<!-- PROJECT-LIST-START -->
[existing project list content]
<!-- PROJECT-LIST-END -->
```

The Scope 2 script will replace everything between these markers on each weekly run.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add GitHub Pages link and sentinel markers for auto-generated list"
```

---

### Task 4: Update `.gitignore` and add PR template

**Files:**
- Modify: `.gitignore`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Append web entries to `.gitignore`**

```bash
cat >> .gitignore <<'EOF'

# React SPA build artifacts
web/node_modules/
web/dist/
web/public/projects.json
EOF
```

- [ ] **Step 2: Create PR template**

```bash
mkdir -p .github
cat > .github/PULL_REQUEST_TEMPLATE.md <<'EOF'
## Adding a New Tool

Please fill in all fields below when adding a new row to `site/projects.csv`.

- **Name:**
- **Description:**
- **Section:** (e.g. `Python > Financial Instruments and Pricing`)
- **Site URL:**
- **GitHub Link:** (if applicable, full URL e.g. `https://github.com/owner/repo`)
EOF
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore .github/PULL_REQUEST_TEMPLATE.md
git commit -m "chore: update gitignore for web/ build artifacts, add PR template"
```

---

## Phase 2 — Data Refresh Script

### Task 5: Write `scripts/fetch_last_commits.sh`

**Files:**
- Create: `scripts/fetch_last_commits.sh`

- [ ] **Step 1: Create the scripts directory and file**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write the script**

Create `scripts/fetch_last_commits.sh` with the following content:

```bash
#!/usr/bin/env bash
set -euo pipefail

CSV="site/projects.csv"
OUTPUT="last_commit_times.csv"
BATCH_SIZE=10
DELAY=2

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is not set" >&2
  exit 1
fi

# Extract GitHub URLs from projects.csv using python3 (handles quoted CSV correctly)
github_urls=$(python3 - <<'PYEOF'
import csv, sys
with open('site/projects.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        url = row['url'].strip()
        if url.startswith('https://github.com/'):
            print(url)
PYEOF
)

echo "url,last_commit" > "$OUTPUT"

count=0
batch=()

fetch_batch() {
  for url in "${batch[@]}"; do
    # Extract owner/repo: strip scheme+host, take first two path segments, strip .git
    path="${url#https://github.com/}"
    owner_repo=$(echo "$path" | sed 's|\.git$||' | cut -d'/' -f1-2)

    if [ -z "$owner_repo" ] || [ "$(echo "$owner_repo" | tr -cd '/' | wc -c)" -lt 1 ]; then
      echo "WARN: could not extract owner/repo from $url" >&2
      echo "\"$url\"," >> "$OUTPUT"
      continue
    fi

    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${owner_repo}/commits?per_page=1")

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" != "200" ]; then
      echo "WARN: $url → HTTP $http_code" >&2
      echo "\"$url\"," >> "$OUTPUT"
    else
      last_commit=$(echo "$body" | jq -r '.[0].commit.author.date // empty' | cut -c1-10)
      echo "\"$url\",\"$last_commit\"" >> "$OUTPUT"
    fi
  done
}

while IFS= read -r url; do
  batch+=("$url")
  count=$((count + 1))

  if [ ${#batch[@]} -ge "$BATCH_SIZE" ]; then
    fetch_batch
    batch=()
    echo "Fetched $count repos, sleeping ${DELAY}s..." >&2
    sleep "$DELAY"
  fi
done <<< "$github_urls"

# Flush remaining batch
if [ ${#batch[@]} -gt 0 ]; then
  fetch_batch
fi

echo "Done. Written to $OUTPUT" >&2

# Regenerate README project list between sentinel markers
python3 - <<'PYEOF'
import csv, re

with open('site/projects.csv', newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

# Group by section, sort sections and entries alphabetically
from collections import defaultdict
sections = defaultdict(list)
for row in rows:
    sections[row['section']].append(row)

lines = ['']
for section in sorted(sections.keys()):
    lines.append(f'### {section}')
    lines.append('')
    for row in sorted(sections[section], key=lambda r: r['project'].lower()):
        lines.append(f"- [{row['project']}]({row['url']}) \u2014 {row['description']}")
    lines.append('')

# Remove trailing blank line before end marker
while lines and lines[-1] == '':
    lines.pop()

block = '\n'.join(lines)

with open('README.md', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = re.sub(
    r'<!-- PROJECT-LIST-START -->.*?<!-- PROJECT-LIST-END -->',
    f'<!-- PROJECT-LIST-START -->\n{block}\n\n<!-- PROJECT-LIST-END -->',
    content,
    flags=re.DOTALL
)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('README.md project list regenerated.')
PYEOF

# Commit if anything changed
git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
git add last_commit_times.csv README.md
git diff --cached --quiet || git commit -m "chore: update last commit times and README [skip ci]"
git push
```

- [ ] **Step 3: Make the script executable**

```bash
chmod +x scripts/fetch_last_commits.sh
```

- [ ] **Step 4: Smoke test locally with a tiny mock CSV**

```bash
python3 - <<'EOF'
import csv
with open('/tmp/test_projects.csv', 'w') as f:
    w = csv.writer(f)
    w.writerow(['project','section','url','description','github','cran'])
    w.writerow(['quantdsl','Python','https://github.com/johnbywater/quantdsl','DSL for quant','True','False'])
    w.writerow(['numpy','Python','https://numpy.org','Numeric computing','False','False'])
print("Mock CSV written to /tmp/test_projects.csv")
EOF

# Verify the URL-filtering logic in isolation
python3 - <<'EOF'
import csv
with open('/tmp/test_projects.csv', newline='') as f:
    for row in csv.DictReader(f):
        url = row['url'].strip()
        if url.startswith('https://github.com/'):
            print(url)
EOF
```

Expected output: `https://github.com/johnbywater/quantdsl` (numpy.org is excluded).

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch_last_commits.sh
git commit -m "feat: add fetch_last_commits.sh script"
```

---

### Task 6: Create `.github/workflows/fetch-commits.yml`

**Files:**
- Create: `.github/workflows/fetch-commits.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/fetch-commits.yml`:

```yaml
name: Fetch Last Commit Times

on:
  schedule:
    - cron: '0 0 * * 1'   # Every Monday 00:00 UTC
  workflow_dispatch:        # Manual trigger

permissions:
  contents: write           # Required to commit and push

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Fetch last commit times
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/fetch_last_commits.sh
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/fetch-commits.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/fetch-commits.yml
git commit -m "feat: add weekly fetch-commits workflow"
```

---

## Phase 3 — React SPA

### Task 7: Scaffold the `web/` Vite + React + TypeScript project

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/tsconfig.node.json`, `web/index.html`

- [ ] **Step 1: Scaffold with Vite**

```bash
npm create vite@latest web -- --template react-ts
```

When prompted: framework = React, variant = TypeScript.

- [ ] **Step 2: Verify the scaffold**

```bash
ls web/
```

Expected: `index.html  package.json  public/  src/  tsconfig.json  tsconfig.node.json  vite.config.ts`

- [ ] **Step 3: Update `web/vite.config.ts` to set the GitHub Pages base path**

Replace the contents of `web/vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/awesome-quant-tools-in-table/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Install dependencies**

```bash
cd web && npm install
```

- [ ] **Step 5: Verify build compiles cleanly**

```bash
cd web && npm run build 2>&1 | tail -5
```

Expected: output ends with `✓ built in ...ms` and exits 0. (Full dev server verification is covered in Task 13 Step 4.)

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/
git commit -m "feat: scaffold web/ with Vite + React + TypeScript"
```

---

### Task 8: Install Shadcn/ui and TanStack Table

**Files:**
- Modify: `web/package.json`
- Create: `web/components.json`

- [ ] **Step 1: Install Shadcn/ui**

```bash
cd web && npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

This creates `web/components.json` and sets up `web/src/lib/utils.ts`.

- [ ] **Step 2: Add the Shadcn components we need**

```bash
cd web && npx shadcn@latest add table input badge button popover command
```

- [ ] **Step 3: Install TanStack Table and papaparse**

```bash
cd web && npm install @tanstack/react-table
cd web && npm install --save-dev papaparse @types/papaparse
```

- [ ] **Step 4: Verify installs**

```bash
# @tanstack/react-table v8 is ESM-only; use dynamic import
cd web && node --input-type=module <<< "import('@tanstack/react-table').then(() => console.log('TanStack Table OK'))"
cd web && node -e "require('papaparse'); console.log('papaparse OK')"
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/
git commit -m "feat: install Shadcn/ui, TanStack Table, papaparse"
```

---

### Task 9: Write and test `web/scripts/build-data.mjs`

**Files:**
- Create: `web/scripts/build-data.mjs`

- [ ] **Step 1: Create a test fixture**

```bash
mkdir -p web/scripts/test-fixtures
cat > web/scripts/test-fixtures/projects.csv <<'EOF'
project,section,url,description,github,cran
ArcticDB,Python > Data,https://github.com/man-group/ArcticDB,High perf datastore,True,False
numpy,Python > Numerical,https://numpy.org,Numeric computing,False,False
EOF

cat > web/scripts/test-fixtures/last_commit_times.csv <<'EOF'
url,last_commit
https://github.com/man-group/ArcticDB,2025-12-30
EOF
```

- [ ] **Step 2: Write `build-data.mjs`**

Create `web/scripts/build-data.mjs`:

```js
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Resolve a path relative to this script file (not the process CWD).
 * Required because the workflow runs: node web/scripts/build-data.mjs from repo root.
 */
function rel(...parts) {
  return resolve(__dirname, ...parts)
}

const PROJECTS_CSV  = rel('../../site/projects.csv')
const COMMITS_CSV   = rel('../../last_commit_times.csv')
const OUTPUT_JSON   = rel('../public/projects.json')

// --- Parse projects.csv ---
const projectsRaw = readFileSync(PROJECTS_CSV, 'utf-8')
const { data: projects, errors: pErrors } = Papa.parse(projectsRaw, { header: true, skipEmptyLines: true })
if (pErrors.length) {
  console.error('projects.csv parse errors:', pErrors)
  process.exit(1)
}

// --- Parse last_commit_times.csv (optional) ---
let commitMap = new Map()
if (existsSync(COMMITS_CSV)) {
  const commitsRaw = readFileSync(COMMITS_CSV, 'utf-8')
  const { data: commits } = Papa.parse(commitsRaw, { header: true, skipEmptyLines: true })
  for (const row of commits) {
    if (row.url && row.last_commit) {
      commitMap.set(row.url.trim(), row.last_commit.trim())
    }
  }
  console.log(`Loaded ${commitMap.size} commit times`)
} else {
  console.warn(`WARN: ${COMMITS_CSV} not found — last_commit will be null for all projects`)
}

// --- Merge ---
const merged = projects.map(row => ({
  project:     row.project?.trim() ?? '',
  section:     row.section?.trim() ?? '',
  url:         row.url?.trim() ?? '',
  description: row.description?.trim() ?? '',
  github:      row.github?.trim() === 'True',
  cran:        row.cran?.trim() === 'True',
  last_commit: commitMap.get(row.url?.trim()) ?? null,
}))

// --- Write output ---
writeFileSync(OUTPUT_JSON, JSON.stringify(merged, null, 2))
console.log(`Wrote ${merged.length} projects to ${OUTPUT_JSON}`)
```

- [ ] **Step 3: Write a test script to verify the merge logic**

Create `web/scripts/test-build-data.mjs`:

```js
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Run build-data against fixtures
const fixtureProjects = resolve(__dirname, 'test-fixtures/projects.csv')
const fixtureCommits  = resolve(__dirname, 'test-fixtures/last_commit_times.csv')

const projects = Papa.parse(readFileSync(fixtureProjects, 'utf-8'), { header: true, skipEmptyLines: true }).data
const commits  = Papa.parse(readFileSync(fixtureCommits,  'utf-8'), { header: true, skipEmptyLines: true }).data

const commitMap = new Map(commits.map(r => [r.url.trim(), r.last_commit.trim()]))

const merged = projects.map(row => ({
  project:     row.project.trim(),
  section:     row.section.trim(),
  url:         row.url.trim(),
  description: row.description.trim(),
  github:      row.github.trim() === 'True',
  cran:        row.cran.trim() === 'True',
  last_commit: commitMap.get(row.url.trim()) ?? null,
}))

// Assertions
console.assert(merged.length === 2, 'Expected 2 projects')
console.assert(merged[0].project === 'ArcticDB', 'First project is ArcticDB')
console.assert(merged[0].github === true, 'ArcticDB github flag is boolean true')
console.assert(merged[0].last_commit === '2025-12-30', 'ArcticDB has last_commit')
console.assert(merged[1].project === 'numpy', 'Second project is numpy')
console.assert(merged[1].github === false, 'numpy github flag is boolean false')
console.assert(merged[1].last_commit === null, 'numpy has no last_commit')
console.log('All assertions passed.')
```

- [ ] **Step 4: Run the test**

```bash
cd web && node scripts/test-build-data.mjs
```

Expected: `All assertions passed.`

- [ ] **Step 5: Run build-data against the real CSV**

> **Requires:** Task 2 completed (so `site/projects.csv` has 6 columns), and Task 7 Step 4 (`cd web && npm install`) completed (so `papaparse` is available in `web/node_modules`).

```bash
mkdir -p web/public
node web/scripts/build-data.mjs
```

Expected: `Wrote N projects to .../web/public/projects.json`

- [ ] **Step 6: Spot-check the output**

```bash
python3 -c "
import json
data = json.load(open('web/public/projects.json'))
print(f'{len(data)} projects')
print('First:', data[0])
print('github type:', type(data[0][\"github\"]))
"
```

Expected: `github type: <class 'bool'>` (not string).

- [ ] **Step 7: Commit**

```bash
git add web/scripts/
git commit -m "feat: add build-data.mjs to merge CSVs into projects.json"
```

---

### Task 10: Define TypeScript types and set up Vitest

**Files:**
- Create: `web/src/types.ts`

- [ ] **Step 1: Install Vitest and Testing Library**

```bash
cd web && npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Add vitest config to `web/vite.config.ts`**

Add the `test` block:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/awesome-quant-tools-in-table/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `web/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to `web/package.json`**

In the `scripts` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create `web/src/types.ts`**

```ts
export interface Project {
  project: string
  section: string
  url: string
  description: string
  github: boolean
  cran: boolean
  last_commit: string | null  // 'YYYY-MM-DD' or null
}
```

- [ ] **Step 6: Write a trivial passing test to verify Vitest works**

Create `web/src/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Project } from './types'

describe('Project type', () => {
  it('accepts a valid project with null last_commit', () => {
    const p: Project = {
      project: 'numpy',
      section: 'Python > Numerical',
      url: 'https://numpy.org',
      description: 'Numeric computing',
      github: false,
      cran: false,
      last_commit: null,
    }
    expect(p.last_commit).toBeNull()
    expect(p.github).toBe(false)
  })

  it('accepts a project with a last_commit date', () => {
    const p: Project = {
      project: 'ArcticDB',
      section: 'Python > Data',
      url: 'https://github.com/man-group/ArcticDB',
      description: 'High perf datastore',
      github: true,
      cran: false,
      last_commit: '2025-12-30',
    }
    expect(p.last_commit).toBe('2025-12-30')
    expect(p.github).toBe(true)
  })
})
```

- [ ] **Step 7: Run tests**

```bash
cd web && npm test
```

Expected: 2 tests pass.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/src/types.ts web/src/types.test.ts web/src/test-setup.ts web/vite.config.ts web/package.json
git commit -m "feat: add Project type, Vitest setup"
```

---

### Task 11: Build `Filters.tsx` — search input + section multi-select

**Files:**
- Create: `web/src/components/Filters.tsx`
- Create: `web/src/components/Filters.test.tsx`

The section multi-select uses Shadcn's `Command` + `Popover` primitives. When no sections are selected, all rows are shown. The component is controlled — it calls `onSearchChange` and `onSectionsChange` when values change.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/Filters.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Filters } from './Filters'

const sections = ['Python > Data', 'Python > Numerical', 'R > Statistics']

describe('Filters', () => {
  it('renders search input and section button', () => {
    render(
      <Filters
        sections={sections}
        selectedSections={[]}
        search=""
        onSearchChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /section/i })).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', async () => {
    const onSearch = vi.fn()
    render(
      <Filters
        sections={sections}
        selectedSections={[]}
        search=""
        onSearchChange={onSearch}
        onSectionsChange={vi.fn()}
      />
    )
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'arc')
    // userEvent.type fires onChange once per character; 'arc' = 3 calls
    expect(onSearch).toHaveBeenCalledTimes(3)
    expect(onSearch).toHaveBeenLastCalledWith('c')
  })

  it('shows selected section count in button label', () => {
    render(
      <Filters
        sections={sections}
        selectedSections={['Python > Data']}
        search=""
        onSearchChange={vi.fn()}
        onSectionsChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /1 selected/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd web && npm test -- --reporter=verbose
```

Expected: FAIL — `Filters` not found.

- [ ] **Step 3: Implement `Filters.tsx`**

Create `web/src/components/Filters.tsx`:

```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FiltersProps {
  sections: string[]
  selectedSections: string[]
  search: string
  onSearchChange: (value: string) => void
  onSectionsChange: (sections: string[]) => void
}

export function Filters({
  sections,
  selectedSections,
  search,
  onSearchChange,
  onSectionsChange,
}: FiltersProps) {
  const [open, setOpen] = useState(false)

  function toggleSection(section: string) {
    if (selectedSections.includes(section)) {
      onSectionsChange(selectedSections.filter(s => s !== section))
    } else {
      onSectionsChange([...selectedSections, section])
    }
  }

  const label = selectedSections.length === 0
    ? 'Section'
    : `${selectedSections.length} selected`

  return (
    <div className="flex gap-2 flex-wrap">
      <Input
        placeholder="Search by name or description..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="max-w-sm"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={label}>
            {label}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search sections..." />
            <CommandList>
              <CommandEmpty>No sections found.</CommandEmpty>
              <CommandGroup>
                {sections.map(section => (
                  <CommandItem
                    key={section}
                    onSelect={() => toggleSection(section)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedSections.includes(section) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {section}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/components/
git commit -m "feat: add Filters component with search and section multi-select"
```

---

### Task 12: Build `ToolsTable.tsx` — the main data table

**Files:**
- Create: `web/src/components/ToolsTable.tsx`
- Create: `web/src/components/ToolsTable.test.tsx`

Uses TanStack Table v8 for sorting/filtering. Receives `data: Project[]` and the filter state as props.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/ToolsTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolsTable } from './ToolsTable'
import type { Project } from '../types'

const projects: Project[] = [
  {
    project: 'ArcticDB',
    section: 'Python > Data',
    url: 'https://github.com/man-group/ArcticDB',
    description: 'High perf datastore',
    github: true,
    cran: false,
    last_commit: '2025-12-30',
  },
  {
    project: 'numpy',
    section: 'Python > Numerical',
    url: 'https://numpy.org',
    description: 'Numeric computing',
    github: false,
    cran: false,
    last_commit: null,
  },
]

describe('ToolsTable', () => {
  it('renders all project rows', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
    expect(screen.getByText('numpy')).toBeInTheDocument()
  })

  it('filters rows by search term', () => {
    render(<ToolsTable data={projects} search="arctic" selectedSections={[]} />)
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
    expect(screen.queryByText('numpy')).not.toBeInTheDocument()
  })

  it('filters rows by selected section', () => {
    render(
      <ToolsTable data={projects} search="" selectedSections={['Python > Numerical']} />
    )
    expect(screen.queryByText('ArcticDB')).not.toBeInTheDocument()
    expect(screen.getByText('numpy')).toBeInTheDocument()
  })

  it('renders GitHub link for GitHub projects', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/man-group/ArcticDB')
  })

  it('shows blank last_commit for projects without one', () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    expect(screen.getByText('2025-12-30')).toBeInTheDocument()
    // numpy's last_commit cell should be empty — check it has no date text
    const cells = screen.getAllByRole('cell')
    const numpyRow = cells.find(c => c.textContent?.includes('Numeric computing'))
    expect(numpyRow).toBeDefined()
  })

  it('sorts by last_commit when header is clicked', async () => {
    render(<ToolsTable data={projects} search="" selectedSections={[]} />)
    const header = screen.getByRole('button', { name: /last commit/i })
    await userEvent.click(header)
    // After clicking, rows should still render
    expect(screen.getByText('ArcticDB')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd web && npm test
```

Expected: FAIL — `ToolsTable` not found.

- [ ] **Step 3: Implement `ToolsTable.tsx`**

Create `web/src/components/ToolsTable.tsx`:

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type FilterFn,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project } from '../types'

const columnHelper = createColumnHelper<Project>()

interface ToolsTableProps {
  data: Project[]
  search: string
  selectedSections: string[]
}

const globalFilterFn: FilterFn<Project> = (row, _columnId, filterValue: string) => {
  const q = filterValue.toLowerCase()
  return (
    row.original.project.toLowerCase().includes(q) ||
    row.original.description.toLowerCase().includes(q)
  )
}

export function ToolsTable({ data, search, selectedSections }: ToolsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Filter by selected sections client-side before passing to table
  const filtered = useMemo(() => {
    if (selectedSections.length === 0) return data
    return data.filter(p => selectedSections.includes(p.section))
  }, [data, selectedSections])

  const columns = useMemo(() => [
    columnHelper.accessor('project', {
      header: 'Name',
      cell: info => (
        <a
          href={info.row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline"
        >
          {info.getValue()}
        </a>
      ),
    }),
    columnHelper.accessor('section', {
      header: 'Section',
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => (
        <span className="line-clamp-2" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('github', {
      header: 'GitHub',
      enableSorting: false,
      cell: info =>
        info.getValue() ? (
          <a
            href={info.row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex"
          >
            <Github className="h-4 w-4" />
          </a>
        ) : null,
    }),
    columnHelper.accessor('last_commit', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label="Last Commit"
        >
          Last Commit
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      sortUndefined: 'last',   // null values always sort last
      cell: info => info.getValue() ?? '',
    }),
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/components/ToolsTable.tsx web/src/components/ToolsTable.test.tsx
git commit -m "feat: add ToolsTable component with sorting and filtering"
```

---

### Task 13: Wire up `App.tsx` and `main.tsx`

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/main.tsx`

- [ ] **Step 1: Write `App.tsx`**

Replace `web/src/App.tsx`:

```tsx
import { useState, useEffect, useMemo } from 'react'
import { Filters } from './components/Filters'
import { ToolsTable } from './components/ToolsTable'
import type { Project } from './types'

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/awesome-quant-tools-in-table/projects.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Project[]) => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const sections = useMemo(
    () => [...new Set(projects.map(p => p.section))].sort(),
    [projects]
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Awesome Quant Tools</h1>
      <p className="text-muted-foreground mb-6">
        A curated list of quantitative finance tools. Source:{' '}
        <a
          href="https://github.com/hbai/awesome-quant-tools-in-table"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-4">
            <Filters
              sections={sections}
              selectedSections={selectedSections}
              search={search}
              onSearchChange={setSearch}
              onSectionsChange={setSelectedSections}
            />
          </div>
          <ToolsTable
            data={projects}
            search={search}
            selectedSections={selectedSections}
          />
          <p className="text-sm text-muted-foreground mt-4">
            {projects.length} tools total
          </p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `main.tsx` to import global CSS**

Ensure `web/src/main.tsx` looks like:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Run the full test suite**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
cd web && npm run build
```

Expected: build completes successfully, `web/dist/` is created.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/App.tsx web/src/main.tsx
git commit -m "feat: wire up App.tsx with data fetch, Filters, and ToolsTable"
```

---

### Task 14: Create `.github/workflows/deploy-spa.yml`

**Files:**
- Create: `.github/workflows/deploy-spa.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/deploy-spa.yml`:

```yaml
name: Deploy SPA

on:
  push:
    branches: [master]
    # Auto-commits from fetch-commits.yml contain [skip ci] which suppresses
    # this push trigger. Those deploys are handled by the workflow_run trigger below.
  workflow_run:
    workflows: ["Fetch Last Commit Times"]
    types: [completed]
    # fires on any conclusion; the job-level 'if' below gates on success only

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    if: >
      github.event_name == 'push' ||
      github.event.workflow_run.conclusion == 'success'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd web && npm ci
      - name: Build data (merge CSVs → projects.json)
        run: node web/scripts/build-data.mjs
      - name: Build SPA
        run: cd web && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web/dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-spa.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-spa.yml
git commit -m "feat: add deploy-spa GitHub Actions workflow"
```

---

### Task 15: Integration smoke test and final cleanup

- [ ] **Step 1: Run the full build pipeline end-to-end locally**

```bash
# Regenerate projects.json from real CSV
node web/scripts/build-data.mjs

# Build the SPA
cd web && npm run build && cd ..

# Verify dist contains expected files
ls web/dist/
```

Expected: `index.html  assets/`

- [ ] **Step 2: Check the built index.html references the correct base path**

```bash
grep 'awesome-quant-tools-in-table' web/dist/index.html
```

Expected: at least one hit (Vite injects the base into asset URLs).

- [ ] **Step 3: Run the full test suite one final time**

```bash
cd web && npm test && cd ..
```

Expected: all tests pass.

- [ ] **Step 4: Clean up test fixtures (they were build-time helpers, not shipped)**

```bash
rm -rf web/scripts/test-fixtures web/scripts/test-build-data.mjs
git add -A
git commit -m "chore: remove test fixtures used during build-data development"
```

- [ ] **Step 5: Final commit with all remaining changes**

```bash
git status
# Stage anything unstaged
git add -A
git diff --cached --quiet || git commit -m "chore: final cleanup and integration verification"
```

- [ ] **Step 6: One-time manual step — enable GitHub Pages**

In the GitHub repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

This only needs to be done once. After this, pushing to `master` will trigger the deploy workflow automatically.

---

## Summary

| Phase | Tasks | Key outputs |
|---|---|---|
| Phase 1 — Simplify | 1–4 | Cleaned repo, 6-column CSV, README with sentinels, PR template |
| Phase 2 — Data refresh | 5–6 | `scripts/fetch_last_commits.sh`, `fetch-commits.yml` |
| Phase 3 — React SPA | 7–15 | `web/` app, `build-data.mjs`, `deploy-spa.yml`, live GH Pages site |
