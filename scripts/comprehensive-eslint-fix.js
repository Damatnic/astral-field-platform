const fs = require('fs');
const path = require('path');
console.log('🔧 Starting comprehensive ESLint fixes...');
const srcDir = path.join(__dirname, '..', 'src');
// Fix patterns that were broken by the aggressive parameter prefixing
const fixPatterns = [
  // Fix malformed function parameters like _([, _a], _[, _b])
  {
    search: /\._sort\(_\(\[\s*_([^,\]]+)\],\s*_\[,\s*_([^,\]]+)\]\)\s*=>\s*([^-]+)\s*-\s*([^)]+)\)/g,
    replace: '.sort(([$1], [, $2]) => $3 - $4)'
  },
  // Fix malformed reduce functions like _(sum, _count)
  {
    search: /\.reduce\(_\(([^]+),\s*_([^)]+)\)\s*=>\s*([^+]+)\s*\+\s*([^)]+)/g,
    replace: '.reduce(($1$2) => $3 + $4'
  },
  // Fix map functions like _(rec: unknown_index: number)
  {
    search: /\.map\(_\(([^:]+):\s*([^]+),\s*_([^: ]+):\s*([^)]+)\)\s*=>/greplace: '.map(($1: $2$3: $4) =>'
  },
  // Fix function parameters that start with _async
  {
    search: /_async\s+/greplace: 'async '
  },
  // Fix malformed catch blocks like .catch(_() => 
  {
    search: /\.catch\(_\(\)\s*=>/greplace: '.catch(() =>'
  },
  // Fix variable declarations like const riskScore += 
  {
    search: /const\s+([^=]+)\s*\+=/greplace: 'let $1 +='
  },
  // Fix for loops with const i
  {
    search: /for\s*\(\s*const\s+(i\s*=\s*[^;]+;[^)]+)\)/greplace: 'for (let $1)'
  },
  // Fix error parameter type assertions
  {
    search: /error\?\.\?message/greplace: '(error as any)?.message'
  },
  // Fix _playerName to playerName
  {
    search: /_playerName:/greplace: 'playerName:'
  },
  // Fix property access on unknown types  
  {
    search: /\(p:\s*unknown\)\s*=>\s*p\.id/greplace: '(p: any) => p.id'
  }
];
function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const modified = false;
  fixPatterns.forEach(pattern => {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      modified = true;
    }
  });
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed parsing errors in: ${filePath}`);
  }
}
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}
processDirectory(srcDir);
console.log('✨ Comprehensive ESLint fixes complete!');