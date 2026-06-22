#!/usr/bin/env python3
"""Fix double-escaped backticks in blog-posts.ts.

The MultiEdit tool inserted \\\\` (two backslashes + backtick) where we needed
just \\` (one backslash + backtick) — i.e. an escaped backtick inside the TS
template literal. Replace all `\\\\\\`` with `\\\\` + backtick.
"""
from pathlib import Path

path = Path("/home/z/my-project/File-Flex-main/src/lib/blog-posts.ts")
src = path.read_text()

# Each `\\` (two literal backslashes) immediately followed by a backtick
# should become a single backslash followed by a backtick.
fixed = src.replace("\\\\`", "\\`")

path.write_text(fixed)
print(f"Replaced {src.count('\\\\`')} occurrences of \\\\\\` with \\`")
print(f"File size: {len(fixed)} bytes")
