import re

log_file = 'nexus.log'
search_pattern = r"18:43:(0[5-9]|1[0-5])" # Capture 18:43:05 to 18:43:15

try:
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if re.search(search_pattern, line):
                print(line.strip())
except Exception as e:
    print(f"Error: {e}")
