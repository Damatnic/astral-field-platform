const fs = require('fs');
const path = require('path');

// Ultra-aggressive fix script for remaining TypeScript errors
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist' || file === 'build') {
      return;
    }
    
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixCount = 0;
    
    // === ULTRA-AGGRESSIVE PATTERNS ===
    
    // Fix double const declarations
    content = content.replace(/\bconst\s+const\s+/g, () => { fixCount++; return 'const '; });
    content = content.replace(/\blet\s+let\s+/g, () => { fixCount++; return 'let '; });
    content = content.replace(/\bvar\s+var\s+/g, () => { fixCount++; return 'var '; });
    
    // Fix malformed destructuring with space issues
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s+=\s+([^;]+);/g, (match, props, value) => {
      // Clean up property names
      const cleanProps = props.split(',').map(p => p.trim()).join(', ');
      fixCount++;
      return `const { ${cleanProps} } = ${value.trim()};`;
    });
    
    // Fix object literal issues - missing commas
    content = content.replace(/(\w+):\s*(['"`][^'"`]*['"`])\s+(\w+):/g, (match, p1, p2, p3) => {
      fixCount++;
      return `${p1}: ${p2},\n    ${p3}:`;
    });
    
    // Fix object property patterns with newlines
    content = content.replace(/(\w+):\s*(\w+)\n\s*(\w+):/g, (match, p1, p2, p3) => {
      if (!/^(if|else|for|while|switch|try|catch)$/.test(p1)) {
        fixCount++;
        return `${p1}: ${p2},\n    ${p3}:`;
      }
      return match;
    });
    
    // Fix try-catch blocks with missing braces
    content = content.replace(/try\s+{([^}]+)}\s+catch\s+\(([^)]+)\)\s+([^{])/g, (match, tryBlock, catchParam, afterCatch) => {
      fixCount++;
      return `try {${tryBlock}} catch (${catchParam}) {\n    ${afterCatch}`;
    });
    
    // Fix unterminated template literals
    content = content.replace(/\`([^\`]*)\n\s*\n/g, (match, p1) => {
      if (!match.includes('`')) {
        fixCount++;
        return '`' + p1 + '`\n';
      }
      return match;
    });
    
    // Fix SQL query patterns with missing backticks
    content = content.replace(/const\s+(\w+Query)\s*=\s*([^`\n][^\n]+)$/gm, (match, varName, query) => {
      if (query.includes('SELECT') || query.includes('INSERT') || query.includes('UPDATE') || query.includes('DELETE')) {
        fixCount++;
        return `const ${varName} = \`${query.trim()}\``;
      }
      return match;
    });
    
    // Fix useState and other hook patterns
    content = content.replace(/const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState\(([^)]+)\)\s+const/g, (match, state, setter, initial) => {
      fixCount++;
      return `const [${state}, set${setter}] = useState(${initial});\n  const`;
    });
    
    // Fix JSX conditional rendering patterns
    content = content.replace(/\{(\w+)\s+&&\s+\(/g, (match, condition) => {
      fixCount++;
      return `{${condition} && (`;
    });
    
    // Fix async function declarations
    content = content.replace(/async\s+function\s+(\w+)\s*\(\s*\)\s*{/g, (match, name) => {
      fixCount++;
      return `async function ${name}() {`;
    });
    
    // Fix arrow functions with missing parentheses
    content = content.replace(/const\s+(\w+)\s*=\s*async\s+([^=>\s]+)\s*=>/g, (match, name, params) => {
      if (!params.includes('(')) {
        fixCount++;
        return `const ${name} = async (${params}) =>`;
      }
      return match;
    });
    
    // Fix interface and type definitions
    content = content.replace(/interface\s+(\w+)\s*{\s*([^}]+)\s*}\s*([^;])/g, (match, name, props, after) => {
      // Ensure properties are properly formatted
      const cleanedProps = props.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith(',')) {
          return trimmed + ';';
        }
        return trimmed;
      }).join('\n  ');
      
      fixCount++;
      return `interface ${name} {\n  ${cleanedProps}\n}\n${after}`;
    });
    
    // Fix switch case statements
    content = content.replace(/case\s+['"`]([^'"`]+)['"`]\s*:\s*([^:]+)\s+case/g, (match, caseValue, caseBody) => {
      fixCount++;
      return `case '${caseValue}':\n      ${caseBody.trim()}\n      break;\n    case`;
    });
    
    // Fix malformed imports
    content = content.replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"`]([^'"`]+)['"`]\s*import/g, (match, imports, from) => {
      fixCount++;
      return `import { ${imports} } from '${from}';\nimport`;
    });
    
    // Fix malformed exports
    content = content.replace(/export\s+{\s*([^}]+)\s*}\s+export/g, (match, exports) => {
      fixCount++;
      return `export { ${exports} };\nexport`;
    });
    
    // Fix React component props
    content = content.replace(/const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(\s*{\s*([^}]+)\s*}\s*\)\s*=>/g, (match, name, type, props) => {
      fixCount++;
      return `const ${name}: React.FC<${type}> = ({ ${props} }) =>`;
    });
    
    // Fix className concatenation in JSX
    content = content.replace(/className=\{([^}]+)\s+\+\s+([^}]+)\}/g, (match, part1, part2) => {
      if (!part1.includes('`')) {
        fixCount++;
        return `className={\`${part1.replace(/['"`]/g, '')} \${${part2}}\`}`;
      }
      return match;
    });
    
    // Fix malformed ternary operators
    content = content.replace(/\?\s*([^:]+)\s+:\s+([^;}\n]+)/g, (match, truePart, falsePart) => {
      if (!truePart.includes(':') && !falsePart.includes('?')) {
        fixCount++;
        return `? ${truePart.trim()} : ${falsePart.trim()}`;
      }
      return match;
    });
    
    // Fix array methods chaining
    content = content.replace(/\]\s*\.\s*(\w+)\(/g, (match, method) => {
      fixCount++;
      return `].${method}(`;
    });
    
    // Fix object method definitions
    content = content.replace(/(\w+)\s*:\s*function\s*\(/g, (match, name) => {
      fixCount++;
      return `${name}: function(`;
    });
    
    // Fix async arrow functions in objects
    content = content.replace(/(\w+):\s*async\s*\(\s*\)\s*=>\s*{/g, (match, name) => {
      fixCount++;
      return `${name}: async () => {`;
    });
    
    // Fix CSS-in-JS template literals
    content = content.replace(/styled\.(\w+)\s*\`([^\`]+)\s*\`/g, (match, element, styles) => {
      if (!styles.includes('`')) {
        fixCount++;
        return `styled.${element}\`\n${styles}\n\``;
      }
      return match;
    });
    
    // Fix Promise patterns
    content = content.replace(/new\s+Promise\s*\(\s*\(\s*resolve\s*,\s*reject\s*\)\s*=>\s*{/g, () => {
      fixCount++;
      return 'new Promise((resolve, reject) => {';
    });
    
    // Fix setTimeout/setInterval patterns
    content = content.replace(/setTimeout\s*\(\s*\(\s*\)\s*=>\s*{/g, () => {
      fixCount++;
      return 'setTimeout(() => {';
    });
    
    // Fix useEffect and other hooks
    content = content.replace(/useEffect\s*\(\s*\(\s*\)\s*=>\s*{/g, () => {
      fixCount++;
      return 'useEffect(() => {';
    });
    
    // Fix Redux action creators
    content = content.replace(/const\s+(\w+)\s*=\s*\(\s*([^)]*)\s*\)\s*:\s*([^=]+)\s*=>\s*\(/g, (match, name, params, returnType) => {
      fixCount++;
      return `const ${name} = (${params}): ${returnType} => (`;
    });
    
    // Fix malformed JSX self-closing tags
    content = content.replace(/<(\w+)([^>]*[^/])>[\s]*<\/\1>/g, (match, tag, attrs) => {
      if (!attrs.includes('children')) {
        fixCount++;
        return `<${tag}${attrs} />`;
      }
      return match;
    });
    
    // Fix enum definitions
    content = content.replace(/enum\s+(\w+)\s*{\s*([^}]+)\s*}\s*([^;])/g, (match, name, values, after) => {
      const cleanedValues = values.split(',').map(v => v.trim()).filter(v => v).join(',\n  ');
      fixCount++;
      return `enum ${name} {\n  ${cleanedValues}\n}\n${after}`;
    });
    
    // Fix TypeScript generics
    content = content.replace(/(\w+)<\s*([^>]+)\s*>\s*\(/g, (match, func, generic) => {
      fixCount++;
      return `${func}<${generic.trim()}>(`;
    });
    
    // Fix array/object spread operators
    content = content.replace(/\.\.\.\s*([^,\s}]+)\s*([,}])/g, (match, spread, end) => {
      fixCount++;
      return `...${spread}${end}`;
    });
    
    // Fix missing semicolons after statements
    content = content.replace(/^(\s*)(const|let|var)\s+([^=]+)=([^;{}\n]+)$/gm, (match, indent, keyword, name, value) => {
      if (!value.includes('{') && !value.includes('=>')) {
        fixCount++;
        return `${indent}${keyword} ${name}=${value};`;
      }
      return match;
    });
    
    // Fix React Fragment shorthand
    content = content.replace(/<>\s*([^<]+)\s*<\/>/g, (match, children) => {
      fixCount++;
      return `<>${children.trim()}</>`;
    });
    
    // Write file if changes were made
    if (content !== originalContent && fixCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return fixCount;
    }
    return 0;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return 0;
  }
}

// Main execution
console.log('🚀 Starting ULTRA-AGGRESSIVE TypeScript fix operation...\n');

const srcDir = path.join(process.cwd(), 'src');
const files = getAllFiles(srcDir);

console.log(`Found ${files.length} TypeScript/TSX files to process\n`);

let totalFixes = 0;
let filesFixed = 0;

files.forEach((file, index) => {
  if (index % 50 === 0) {
    console.log(`Progress: ${index}/${files.length} files processed...`);
  }
  
  const fixes = fixFile(file);
  if (fixes > 0) {
    totalFixes += fixes;
    filesFixed++;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✅ Fixed ${fixes} issues in ${relativePath}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✨ ULTRA-FIX OPERATION COMPLETE!');
console.log('='.repeat(60));
console.log(`📊 Statistics:`);
console.log(`   Total files processed: ${files.length}`);
console.log(`   Files with fixes: ${filesFixed}`);
console.log(`   Total fixes applied: ${totalFixes}`);
console.log('='.repeat(60));