import os
import glob

files = glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True)

for file in files:
    if "node_modules" in file or ".next" in file:
        continue
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '<<<<<<< HEAD' not in content:
            continue

        lines = content.split('\n')
        new_lines = []
        state = 'NORMAL' # NORMAL, IN_HEAD, IN_THEIRS
        
        for line in lines:
            if line.startswith('<<<<<<< HEAD'):
                state = 'IN_HEAD'
                continue
            elif line.startswith('======='):
                state = 'IN_THEIRS'
                continue
            elif line.startswith('>>>>>>>'):
                state = 'NORMAL'
                continue
                
            if state == 'NORMAL' or state == 'IN_HEAD':
                new_lines.append(line)
                
        with open(file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Resolved {file}")
    except Exception as e:
        print(f"Error processing {file}: {e}")
