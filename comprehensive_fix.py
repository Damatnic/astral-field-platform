#!/usr/bin/env python3
import os
import re
import glob

def fix_all_syntax_errors():
    """Fix all common malformed syntax errors across the codebase"""
    
    # Find all TypeScript route files
    route_files = glob.glob("src/app/api/**/*.ts", recursive=True)
    
    fixes_applied = 0
    
    for file_path in route_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix malformed object literal openings
            content = re.sub(r'JSON\.stringify\(\{,', r'JSON.stringify({', content)
            content = re.sub(r'requirements: \{,', r'requirements: {', content)
            content = re.sub(r'lastMessage: ([^{]*)\? \{,', r'lastMessage: \1? {', content)
            
            # Remove standalone comma lines
            content = re.sub(r'\n\s*,\s*\n', r'\n', content)
            content = re.sub(r'\n\s*,\s*$', r'', content, flags=re.MULTILINE)
            
            # Fix error.messag, e: 'Unknown error' patterns
            content = re.sub(r'error\.messag,\s*e:\s*["\']Unknown error["\']', r"error.message : 'Unknown error'", content)
            
            # Fix malformed object property syntax
            content = re.sub(r'(\w+):\s*(\w+):', r'\1, \2:', content)
            content = re.sub(r'data:\s*message:\s*timestamp:', r'data: message, timestamp:', content)
            
            # Fix SQL query syntax issues
            content = re.sub(r'\(\s*[^)]*:\s*[^)]*\):\s*VALUES', lambda m: m.group(0).replace(':', ',').replace(') VALUES', ') VALUES'), content)
            
            # Fix array/function call syntax
            content = re.sub(r'\[\s*;', r'[', content)
            content = re.sub(r'\(\s*\[\s*;', r'([', content)
            
            # Fix object property syntax
            content = re.sub(r'(\w+):\s*(\w+);', r'\1: \2,', content)
            
            # Fix function parameter syntax
            content = re.sub(r'\(\s*acc,\s*any;', r'(acc: any,', content)
            content = re.sub(r'fileUrl:\s*fileName\)', r'fileUrl, fileName)', content)
            
            # Fix SQL INSERT statement syntax
            content = re.sub(r'INSERT INTO ([^(]+)\([^)]*:\s*[^)]*\):\s*VALUES', 
                           lambda m: m.group(0).replace(':', ',').replace(') VALUES', ') VALUES'), content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed syntax in: {file_path}")
                fixes_applied += 1
        
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print(f"\nApplied fixes to {fixes_applied} files")

if __name__ == "__main__":
    fix_all_syntax_errors()