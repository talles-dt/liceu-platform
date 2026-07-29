#!/usr/bin/env python3
"""Extract chapter text from DOCX and import into liceu_theoretical_content."""

import zipfile
import re
import json
from pathlib import Path
from typing import List, Dict, Tuple

# Read DOCX and extract chapters
docx_path = Path('/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/AS ARMAS DA PALAVRA APOSTILA.docx')
text = zipfile.ZipFile(docx_path).read('word/document.xml').decode('utf-8', errors='ignore')
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\n+', ' | ', text)
text = re.sub(r'\s+', ' ', text).strip()

# Split into chapters
parts = re.split(r'\s*(?=Capítulo \d+)', text)
chapters: List[Tuple[str, str]] = []

for part in parts:
    title_m = re.match(r'(Capítulo \d+[^–]*– ?[^\n|]{3,180})', part)
    if not title_m:
        continue
    title = title_m.group(1).strip()
    body = part[len(title_m.group(0)):].strip()
    body = re.sub(r'\|\s*', ' ', body)
    body = re.sub(r'\s+', ' ', body).strip()
    chapters.append((title, body))

print(f'Extracted {len(chapters)} chapters')

# Load lessons from DB via supabase CLI
import subprocess
result = subprocess.run(
    ['cd /home/timon/Documents/liceu-underground/code && supabase db query --linked "SELECT id, code, title FROM liceu_lessons ORDER BY code::integer;"'],
    shell=True, capture_output=True, text=True
)
print(result.stdout)
print(result.stderr)
