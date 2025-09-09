import re

fixes = {
    'src/app/api/ai/chat/route.ts': [
        (r'let response: string,', 'let response: string;')
    ],
    'src/app/api/auth/enterprise/oauth/[provider]/route.ts': [
        (r'let userId: string,', 'let userId: string;')
    ],
    'src/app/api/cleanup/route.ts': [
        (r'error\.messag,\s*e: "Cleanup failed"', 'error.message : "Cleanup failed"')
    ],
    'src/app/api/community/posts/route.ts': [
        (r'authorId: isSolution', 'authorId, isSolution')
    ],
    'src/app/api/community/threads/route.ts': [
        (r'const slug = title\s*\n\s*;', 'const slug = title')
    ]
}

for file_path, patterns in fixes.items():
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed: {file_path}')
        else:
            print(f'No changes: {file_path}')
    except Exception as e:
        print(f'Error with {file_path}: {e}')