#!/usr/bin/env python3
"""Extract chapter text from DOCX and update liceu_theoretical_content."""

import zipfile
import re
from pathlib import Path

# Read DOCX
docx_path = Path('/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/AS ARMAS DA PALAVRA APOSTILA.docx')
text = zipfile.ZipFile(docx_path).read('word/document.xml').decode('utf-8', errors='ignore')
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\n+', ' | ', text)
text = re.sub(r'\s+', ' ', text).strip()

# Split into chapters
parts = re.split(r'\s*(?=Capítulo \d+)', text)
chapters = []

for part in parts:
    title_m = re.match(r'(Capítulo \d+[^–]*– ?[^\n|]{3,180})', part)
    if not title_m:
        continue
    title = title_m.group(1).strip()
    body = part[len(title_m.group(0)):].strip()
    body = re.sub(r'\|\s*', ' ', body)
    body = re.sub(r'\s+', ' ', body).strip()
    chapters.append({
        'title': title,
        'body': body,
        'word_count': len(body.split()),
        'char_count': len(body)
    })

print(f'Extracted {len(chapters)} chapters')
for i, ch in enumerate(chapters[:5]):
    print(f"{i+1}. {ch['title'][:60]}... ({ch['word_count']} words, {ch['char_count']} chars)")

# Save extracted text for inspection
Path('/tmp/liceu-docx/extracted-chapters.json').write_text(
    __import__('json').dumps(chapters, ensure_ascii=False, indent=2),
    encoding='utf-8'
)
print('\nSaved to /tmp/liceu-docx/extracted-chapters.json')
