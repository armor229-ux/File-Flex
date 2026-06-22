#!/usr/bin/env python3
"""Count words in each blog post's markdown content."""
import re
import sys
from pathlib import Path

path = Path("/home/z/my-project/File-Flex-main/src/lib/blog-posts.ts")
src = path.read_text()

# The template literal ends with `, (backtick + comma) — a unique terminator
# because inside the template literal, backticks are escaped as \` and don't
# appear followed by a comma.
chunks = re.split(r'\n\s*slug:\s*"', src)[1:]
ok = True
results = []
for c in chunks:
    slug = c.split('"', 1)[0]
    m = re.search(r'content:\s*`', c)
    if not m:
        continue
    start = m.end()
    # Template literal ends on its own line: `\n    ` (newline + indent + backtick),
    # immediately followed by `,\n`. Match that pattern.
    end_match = re.search(r'\n\s*`,\s*\n', c[start:])
    if not end_match:
        continue
    end_idx = start + end_match.start() + len(end_match.group(0)) - len(re.search(r',\s*\n', end_match.group(0)).group(0)) - 1
    # Simpler: end_idx = position of the closing backtick
    end_idx = start + end_match.start() + len(re.match(r'\n\s*', end_match.group(0)).group(0))
    content = c[start:end_idx]
    # Unescape \` → `
    content = content.replace('\\`', '`')
    cleaned = re.sub(r'[`*_#>\-\[\]\(\)!]', ' ', content)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    words = len(cleaned.split())
    status = "OK " if words >= 800 else "FAIL"
    if words < 800:
        ok = False
    results.append((status, slug, words))

for status, slug, words in results:
    print(f"{status} {slug:42s} {words:5d} words")

print("---")
print("ALL PASS" if ok else "SOME FAILED")
sys.exit(0 if ok else 1)
