#!/usr/bin/env python3
"""
Smartquotes conversion for ThinkCard markdown files.
- All straight apostrophes (') -> U+2019 right single quotation mark
- Straight double quotes (") -> U+201C (open) or U+201D (close)
  Open if preceded by: start-of-text, whitespace, opening bracket/paren
  Close otherwise
"""
import sys
from pathlib import Path

OPEN_DOUBLE  = '“'  # "
CLOSE_DOUBLE = '”'  # "
APOSTROPHE   = '’'  # ' (right single / apostrophe — all single quotes)

# Characters after which a quote is an OPENING quote
OPEN_CONTEXT = set(' \t\n\r([{')

def convert(text: str) -> str:
    out = []
    n = len(text)
    for i, ch in enumerate(text):
        if ch == "'":
            # Task spec: all straight apostrophes → U+2019 regardless of context
            out.append(APOSTROPHE)
        elif ch == '"':
            # Opening if at start or after whitespace/opening bracket
            prev = text[i - 1] if i > 0 else None
            if prev is None or prev in OPEN_CONTEXT:
                out.append(OPEN_DOUBLE)
            else:
                out.append(CLOSE_DOUBLE)
        else:
            out.append(ch)
    return ''.join(out)

data_dir = Path(__file__).parent.parent / 'app' / 'data'
files = sorted(data_dir.glob('ThinkCard*.md'))

changed = []
for path in files:
    original = path.read_text(encoding='utf-8')
    converted = convert(original)
    if converted != original:
        path.write_text(converted, encoding='utf-8')
        changed.append(path.name)
        print(f'  updated  {path.name}')
    else:
        print(f'  no change {path.name}')

print(f'\n{len(changed)} file(s) modified: {", ".join(changed) if changed else "none"}')
