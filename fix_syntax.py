#!/usr/bin/env python3
import os
import re

def fix_file(filepath, patterns):
    """Fix syntax errors in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for old_pattern, new_pattern in patterns:
            content = re.sub(old_pattern, new_pattern, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
        else:
            print(f"No changes needed: {filepath}")
    
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Fix patterns for each file
files_to_fix = [
    (r"src\app\api\auth\enterprise\oauth\[provider]\route.ts", [
        (r"JSON\.stringify\(\{,", r"JSON.stringify({"),
    ]),
    (r"src\app\api\auth\enterprise\register\route.ts", [
        (r"requirements: \{,", r"requirements: {"),
    ]),
    (r"src\app\api\chat\direct-messages\conversations\route.ts", [
        (r"lastMessage: row\.last_message_id \? \{,", r"lastMessage: row.last_message_id ? {"),
    ]),
    (r"src\app\api\chat\direct-messages\route.ts", [
        (r"error\.messag,\s*e: 'Unknown error'", r"error.message : 'Unknown error'"),
        (r"data: message: timestamp", r"data: message, timestamp:"),
        (r"userResult\.rows\.reduce\(\(acc, any;", r"userResult.rows.reduce((acc: any,"),
    ]),
    (r"src\app\api\chat\messages\route.ts", [
        (r"error\.messag,\s*e: 'Unknown error'", r"error.message : 'Unknown error'"),
        (r"data: message: timestamp:", r"data: message, timestamp:"),
    ]),
    (r"src\app\api\chat\reactions\route.ts", [
        (r"error\.messag,\s*e: 'Unknown error'", r"error.message : 'Unknown error'"),
    ]),
]

# Process each file
for filepath, patterns in files_to_fix:
    fix_file(filepath, patterns)

print("Syntax fixes complete!")