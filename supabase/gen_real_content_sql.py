#!/usr/bin/env python3
"""Generate SQL with real DOCX content for lessons 1-36."""

import zipfile
import re
import uuid
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
    title_m = re.match(r'(Capítulo \d+[^–]*– ?[^\n|]{3,220})', part)
    if not title_m:
        continue
    title = title_m.group(1).strip()
    body = part[len(title_m.group(0)):].strip()
    body = re.sub(r'\|\s*', ' ', body)
    body = re.sub(r'\s+', ' ', body).strip()
    chapter_num = int(re.search(r'Capítulo (\d+)', title).group(1))
    chapters.append({
        'num': chapter_num,
        'code': str(chapter_num),
        'title': title[:200],
        'body': body,
        'word_count': len(body.split())
    })

print('Extracted', len(chapters), 'chapters from DOCX')

# Generate SQL using parameterized-style safe escaping
def sql_literal(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"

json_refs = sql_literal('["Aristóteles", "Retórica"]')

lines = []
lines.append('-- Real content from AS ARMAS DA PALAVRA APOSTILA.docx')
lines.append('BEGIN;')
lines.append('')

for ch in chapters:
    title_escaped = ch['title'].replace("'", "''")
    body_escaped = ch['body'].replace("'", "''")
    section_id = str(uuid.uuid4())

    lines.append("-- Lesson " + ch['code'] + ": " + ch['title'][:80])
    lines.append("INSERT INTO liceu_theoretical_content (id, lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references)")
    lines.append("VALUES (")
    lines.append("  '" + section_id + "',")
    lines.append("  (SELECT id FROM liceu_lessons WHERE code = '" + ch['code'] + "' LIMIT 1),")
    lines.append("  1,")
    lines.append("  " + sql_literal(title_escaped[:200]) + ",")
    lines.append("  " + sql_literal(body_escaped) + ",")
    lines.append("  ARRAY['direção', 'economia', 'julgamento']::text[],")
    lines.append("  " + json_refs + "::jsonb")
    lines.append(")")
    lines.append("ON CONFLICT (lesson_id, section_order) DO UPDATE SET")
    lines.append("  title = EXCLUDED.title,")
    lines.append("  content_markdown = EXCLUDED.content_markdown;")
    lines.append('')

lines.append('COMMIT;')

sql_content = '\n'.join(lines)
out_path = Path('/home/timon/Documents/liceu-underground/code/supabase/seed_real_content.sql')
out_path.write_text(sql_content, encoding='utf-8')
print('Generated SQL:', out_path)
print('File size:', len(sql_content), 'bytes')
print('Total chapters processed:', len(chapters))
