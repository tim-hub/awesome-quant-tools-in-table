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
      echo "\"$url\",\"\"" >> "$OUTPUT"
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
      echo "\"$url\",\"\"" >> "$OUTPUT"
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
