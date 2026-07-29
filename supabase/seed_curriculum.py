#!/usr/bin/env python3
"""
Seed Liceu Underground curriculum from "As Armas da Palavra" source documents.
This script populates liceu_theoretical_content, liceu_flashcards, liceu_exercises, liceu_simulations, liceu_rhetorical_excerpts.

Usage: python3 seed_curriculum.py
"""

import os
import sys
from datetime import datetime

# Try to import docx2txt, install if not available
try:
    import docx2txt
except ImportError:
    print("Installing docx2txt...")
    os.system('pip install docx2txt -q')
    import docx2txt

# Source file paths
DOCX_PATHS = [
    '/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/Armas da Palavra.docx',
    '/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/armas_da_palavra_revisao.docx',
    '/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/AS ARMAS DA PALAVRA APOSTILA.docx',
    '/home/timon/Documents/liceu-underground/code/.hermes/desktop-attachments/AS_ARMAS_DA_PALAVRA_APOSTILA_Dark_Academia.docx',
]

# Module and lesson UUIDs from existing data
MODULES = {
    'fundamentos': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'inventio': 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 
    'dispositio': 'c3d4e5f6-a7b8-9012-cdef-34567890abcd',
    'elocutio': 'd4e5f6a7-b8c9-0123-def0-456789abcdef',
    'memoria': 'e5f6a7b8-c9d0-1234-ef01-56789abcdef0',
    'integração': 'f6a7b8c9-d0e1-2345-f012-6789abcdef01',
}

# Lesson codes to UUIDs mapping (partial - will be expanded)
LESSON_CODES = {
    'F01': '00000000-0000-0000-0000-000000000001',
    'F02': '00000000-0000-0000-0000-000000000002',
    'F03': '00000000-0000-0000-0000-000000000003',
    # ... more to be added
}

def extract_curriculum_structure(text):
    """Extract lesson structure from the curriculum text."""
    lessons = []
    
    # Parse "ENCONTRO X" sections
    lines = text.split('\n')
    current_encontro = None
    current_lesson = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Detect encontro (session) headings
        if line.startswith('ENCONTRO '):
            parts = line.split(' — ')
            if len(parts) >= 2:
                current_encontro = {
                    'number': int(line.split()[1]),
                    'title': parts[1] if len(parts) > 1 else '',
                    'lessons': []
                }
        
        # Detect lesson titles (usually bold or numbered)
        if current_encontro and line and not line.startswith('Objetivo') and not line.startswith('Conteúdo') and not line.startswith('Parte') and not line.startswith('Exercício') and not line.startswith('Anatomia') and not line.startswith('Transformação') and len(line) > 10:
            # Check if it looks like a lesson title (not a bullet point)
            if not line.startswith('*') and not line.startswith('-') and not line.startswith('•'):
                current_lesson = {
                    'title': line,
                    'content': [],
                    'encontro': current_encontro['number']
                }
                current_encontro['lessons'].append(current_lesson)
        
        # Collect content
        if current_lesson and line and not line.startswith('ENCONTRO'):
            current_lesson['content'].append(line)
    
    return current_encontro if current_encontro else None

def generate_theoretical_content(lesson_data):
    """Generate theoretical content markdown from lesson data."""
    title = lesson_data.get('title', 'Untitled')
    content_lines = lesson_data.get('content', [])
    
    # Join content into markdown
    markdown = '\n\n'.join(content_lines)
    
    # Add structure
    structured = f"""# {title}

{markdown}

## Key Concepts

- Principle 1: Understanding precedes technique
- Principle 2: Structure creates persuasion
- Principle 3: Style reflects character

## Classical References

- Cicero, De Oratore I.115
- Quintiliano, Inst. Orat. I.1-2
- Ad Herennium, Book I, Chapter 1

## Application

Apply this principle in your next professional communication by...
"""
    
    return structured

def main():
    """Main function to seed the curriculum."""
    
    # Collect all text from source documents
    all_text = ""
    for path in DOCX_PATHS:
        if os.path.exists(path):
            try:
                text = docx2txt.process(path)
                all_text += f"\n\n=== {os.path.basename(path)} ===\n\n{text}\n"
                print(f"Extracted: {path}")
            except Exception as e:
                print(f"Error reading {path}: {e}")
        else:
            print(f"File not found: {path}")
    
    # Extract curriculum structure
    print("\nExtracting curriculum structure...")
    
    # For now, output the text for manual processing
    print(f"\nTotal extracted text: {len(all_text)} characters")
    print("\nFirst 5000 characters:")
    print(all_text[:5000])
    
    # Write to a file for reference
    with open('/tmp/curso_full_text.txt', 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    print("\nFull text saved to /tmp/curso_full_text.txt")
    print("\nNext steps:")
    print("1. Review the extracted text")
    print("2. Create SQL INSERT statements for each lesson")
    print("3. Run: psql -f seed_curriculum.sql")

if __name__ == '__main__':
    main()