import re

log_file = 'nexus.log'
# Search specifically for the journal attempt
search_pattern = r"Dear diary"

try:
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if re.search(search_pattern, line):
            print(f"Match at line {i}: {line.strip()}")
            # Print subsequent lines to see the response
            for j in range(i+1, min(i+50, len(lines))):
                print(lines[j].strip())
            break
except Exception as e:
    print(f"Error: {e}")
