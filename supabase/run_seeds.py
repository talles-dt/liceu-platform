#!/usr/bin/env python3
"""Run all seed SQL files against the Supabase database."""

import os
import subprocess
import sys

# Read .env.local to get credentials
env_vars = {}
env_path = '/home/timon/Documents/liceu-underground/code/.env.local'
with open(env_path, 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            env_vars[key.strip()] = value.strip().strip('"').strip("'")

# Get Supabase URL and extract connection info
supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL', '')
# Extract project ref from URL
project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '')

# Get database password from service role key (we need the actual password)
# The service role key is a JWT, we need the database password
# Let's use the Supabase CLI approach instead

seed_files = [
    'seed_part1_fundamentos.sql',
    'seed_part2_inventio.sql', 
    'seed_part3_dispositio.sql',
    'seed_part4_elocutio.sql',
    'seed_part5_memoria.sql',
    'seed_part6_integracao.sql',
    'seed_simulations.sql',
    'seed_excerpts.sql',
    'seed_flashcards.sql',
]

seed_dir = '/home/timon/Documents/liceu-underground/code/supabase'

for seed_file in seed_files:
    filepath = os.path.join(seed_dir, seed_file)
    if os.path.exists(filepath):
        print(f"Running: {seed_file}")
        # Use supabase db query with the linked project
        result = subprocess.run(
            ['supabase', 'db', 'query', '--linked', '-f', filepath],
            capture_output=True, text=True, cwd='/home/timon/Documents/liceu-underground/code'
        )
        if result.returncode == 0:
            print(f"  ✓ Success")
        else:
            print(f"  ✗ Error: {result.stderr[:200]}")
    else:
        print(f"  File not found: {filepath}")

print("\nDone!")
