const fs = require('fs');
const path = require('path');

// Get all TypeScript and TSX files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip node_modules, .next, and other build directories
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
    
    // === AGGRESSIVE FIX PATTERNS ===
    
    // Fix const: pattern with all variations
    content = content.replace(/\bconst:\s+/g, () => { fixCount++; return 'const '; });
    content = content.replace(/\{\s*const:\s+/g, () => { fixCount++; return '{\n  const '; });
    content = content.replace(/^\s*const:\s+/gm, () => { fixCount++; return '  const '; });
    
    // Fix let: and var: patterns
    content = content.replace(/\blet:\s+/g, () => { fixCount++; return 'let '; });
    content = content.replace(/\bvar:\s+/g, () => { fixCount++; return 'var '; });
    
    // Fix if: pattern with all variations
    content = content.replace(/\bif:\s*\(/g, () => { fixCount++; return 'if ('; });
    content = content.replace(/\{\s*if:\s*\(/g, () => { fixCount++; return '{\n    if ('; });
    content = content.replace(/\}\s*else\s+if:\s*\(/g, () => { fixCount++; return '} else if ('; });
    content = content.replace(/^\s*if:\s*\(/gm, () => { fixCount++; return '    if ('; });
    
    // Fix return: pattern
    content = content.replace(/\breturn:\s+/g, () => { fixCount++; return 'return '; });
    content = content.replace(/\{\s*return:\s+/g, () => { fixCount++; return '{\n    return '; });
    content = content.replace(/^\s*return:\s+/gm, () => { fixCount++; return '    return '; });
    
    // Fix try: and catch: patterns
    content = content.replace(/\btry:\s*\{/g, () => { fixCount++; return 'try {'; });
    content = content.replace(/\{\s*try:\s*\{/g, () => { fixCount++; return '{\n    try {'; });
    content = content.replace(/\}\s*catch:\s*\(/g, () => { fixCount++; return '} catch ('; });
    content = content.replace(/^\s*try:\s*\{/gm, () => { fixCount++; return '    try {'; });
    
    // Fix for: pattern
    content = content.replace(/\bfor:\s*\(/g, () => { fixCount++; return 'for ('; });
    content = content.replace(/\{\s*for:\s*\(/g, () => { fixCount++; return '{\n    for ('; });
    
    // Fix while: pattern
    content = content.replace(/\bwhile:\s*\(/g, () => { fixCount++; return 'while ('; });
    
    // Fix switch: and case: patterns
    content = content.replace(/\bswitch:\s*\(/g, () => { fixCount++; return 'switch ('; });
    content = content.replace(/\bcase:\s+/g, () => { fixCount++; return 'case '; });
    content = content.replace(/\bdefault:\s*:/g, () => { fixCount++; return 'default:'; });
    
    // Fix function: pattern
    content = content.replace(/\bfunction:\s+/g, () => { fixCount++; return 'function '; });
    content = content.replace(/\basync\s+function:\s+/g, () => { fixCount++; return 'async function '; });
    
    // Fix throw: pattern
    content = content.replace(/\bthrow:\s+/g, () => { fixCount++; return 'throw '; });
    
    // Fix await: pattern
    content = content.replace(/\bawait:\s+/g, () => { fixCount++; return 'await '; });
    
    // Fix export: pattern
    content = content.replace(/\bexport:\s+/g, () => { fixCount++; return 'export '; });
    
    // Fix import: pattern
    content = content.replace(/\bimport:\s+/g, () => { fixCount++; return 'import '; });
    
    // Fix interface: pattern
    content = content.replace(/\binterface:\s+/g, () => { fixCount++; return 'interface '; });
    
    // Fix type: pattern (careful with this one)
    content = content.replace(/\bexport\s+const\s+type:\s+/g, () => { fixCount++; return 'export type '; });
    content = content.replace(/^\s*type:\s+/gm, () => { fixCount++; return 'type '; });
    
    // Fix class: pattern
    content = content.replace(/\bclass:\s+/g, () => { fixCount++; return 'class '; });
    
    // Fix enum: pattern
    content = content.replace(/\benum:\s+/g, () => { fixCount++; return 'enum '; });
    
    // Fix JSX expression patterns
    content = content.replace(/\{\s*(\w+):\s*&&/g, (match, p1) => { fixCount++; return `{${p1} &&`; });
    content = content.replace(/\{\s*(\w+):\s*===/g, (match, p1) => { fixCount++; return `{${p1} ===`; });
    content = content.replace(/\{\s*(\w+):\s*!==/g, (match, p1) => { fixCount++; return `{${p1} !==`; });
    content = content.replace(/\{\s*!\s*(\w+):\s*&&/g, (match, p1) => { fixCount++; return `{!${p1} &&`; });
    content = content.replace(/\{\s*(\w+):\s*\?/g, (match, p1) => { fixCount++; return `{${p1} ?`; });
    
    // Fix type definitions with semicolons
    content = content.replace(/:\s*Promise<([^>]+)>;\s*\{/g, (match, p1) => { fixCount++; return `: Promise<${p1}> {`; });
    content = content.replace(/\]\s*;\s*string/g, () => { fixCount++; return ']: string'; });
    content = content.replace(/\]\s*;\s*number/g, () => { fixCount++; return ']: number'; });
    content = content.replace(/\]\s*;\s*boolean/g, () => { fixCount++; return ']: boolean'; });
    content = content.replace(/\]\s*;\s*any/g, () => { fixCount++; return ']: any'; });
    content = content.replace(/\]\s*;\s*void/g, () => { fixCount++; return ']: void'; });
    content = content.replace(/\]\s*;\s*undefined/g, () => { fixCount++; return ']: undefined'; });
    content = content.replace(/\]\s*;\s*null/g, () => { fixCount++; return ']: null'; });
    
    // Fix interface property syntax
    content = content.replace(/(\w+)\s*;\s*string/g, (match, p1) => { fixCount++; return `${p1}: string`; });
    content = content.replace(/(\w+)\s*;\s*number/g, (match, p1) => { fixCount++; return `${p1}: number`; });
    content = content.replace(/(\w+)\s*;\s*boolean/g, (match, p1) => { fixCount++; return `${p1}: boolean`; });
    content = content.replace(/(\w+)\s*;\s*any/g, (match, p1) => { fixCount++; return `${p1}: any`; });
    
    // Fix union types
    content = content.replace(/\|\s*,\s*/g, () => { fixCount++; return '| '; });
    content = content.replace(/\|\s*;\s*/g, () => { fixCount++; return '| '; });
    
    // Fix Record types
    content = content.replace(/Record<string\s*,\s*,/g, () => { fixCount++; return 'Record<string,'; });
    content = content.replace(/Record<([^,>]+)\s*,\s*,/g, (match, p1) => { fixCount++; return `Record<${p1},`; });
    
    // Fix object property definitions
    content = content.replace(/,\n\s*}/g, () => { fixCount++; return '\n}'; });
    
    // Fix console statements
    content = content.replace(/console\.log\('([^']+),\s*',\s*/g, (match, p1) => { fixCount++; return `console.log('${p1}:', `; });
    content = content.replace(/console\.error\('([^']+),\s*',\s*/g, (match, p1) => { fixCount++; return `console.error('${p1}:', `; });
    content = content.replace(/console\.warn\('([^']+),\s*',\s*/g, (match, p1) => { fixCount++; return `console.warn('${p1}:', `; });
    content = content.replace(/console\.log\("([^"]+),\s*",\s*/g, (match, p1) => { fixCount++; return `console.log("${p1}:", `; });
    content = content.replace(/console\.error\("([^"]+),\s*",\s*/g, (match, p1) => { fixCount++; return `console.error("${p1}:", `; });
    
    // Fix CSS class patterns in TSX files
    if (filePath.endsWith('.tsx')) {
      // Fix Tailwind class separators
      content = content.replace(/dark:\s+/g, () => { fixCount++; return 'dark:'; });
      content = content.replace(/hover:\s+/g, () => { fixCount++; return 'hover:'; });
      content = content.replace(/focus:\s+/g, () => { fixCount++; return 'focus:'; });
      content = content.replace(/disabled:\s+/g, () => { fixCount++; return 'disabled:'; });
      content = content.replace(/sm:\s+/g, () => { fixCount++; return 'sm:'; });
      content = content.replace(/md:\s+/g, () => { fixCount++; return 'md:'; });
      content = content.replace(/lg:\s+/g, () => { fixCount++; return 'lg:'; });
      content = content.replace(/xl:\s+/g, () => { fixCount++; return 'xl:'; });
      content = content.replace(/2xl:\s+/g, () => { fixCount++; return '2xl:'; });
      
      // Fix grid and flex patterns
      content = content.replace(/grid-cols-(\d+)\s+lg;\s*/g, (match, p1) => { fixCount++; return `grid-cols-${p1} lg:`; });
      content = content.replace(/grid-cols-(\d+)\s+md;\s*/g, (match, p1) => { fixCount++; return `grid-cols-${p1} md:`; });
      content = content.replace(/flex-col\s+lg;\s*/g, () => { fixCount++; return 'flex-col lg:'; });
      content = content.replace(/flex-row\s+lg;\s*/g, () => { fixCount++; return 'flex-row lg:'; });
    }
    
    // Fix malformed ternary operators
    content = content.replace(/\?\s*([^:]+)\s+\.\s*/g, (match, p1) => { fixCount++; return `? ${p1} : `; });
    content = content.replace(/\?\s*([^:]+)\s+;\s*/g, (match, p1) => { fixCount++; return `? ${p1} : `; });
    
    // Fix async function patterns
    content = content.replace(/async\s+\(\)\s+=>\s+\{/g, () => { fixCount++; return 'async () => {'; });
    content = content.replace(/async\s+function\s+(\w+)\s*\(\)\s*;\s*\{/g, (match, p1) => { fixCount++; return `async function ${p1}() {`; });
    
    // Fix arrow function patterns
    content = content.replace(/=>\s+\{\s*const:/g, () => { fixCount++; return '=> {\n  const'; });
    content = content.replace(/=>\s+\{\s*if:/g, () => { fixCount++; return '=> {\n  if'; });
    content = content.replace(/=>\s+\{\s*return:/g, () => { fixCount++; return '=> {\n  return'; });
    
    // Fix method signature patterns
    content = content.replace(/(\w+)\s*\(\)\s*;\s*\{/g, (match, p1) => { fixCount++; return `${p1}() {`; });
    content = content.replace(/(\w+)\s*\(([^)]*)\)\s*;\s*\{/g, (match, p1, p2) => { fixCount++; return `${p1}(${p2}) {`; });
    
    // Fix property access patterns
    content = content.replace(/\.\s+(\w+)/g, (match, p1) => { fixCount++; return `.${p1}`; });
    
    // Fix SQL query patterns
    content = content.replace(/WHERE\s+id\s*=\s*\$1"\s*:/g, () => { fixCount++; return 'WHERE id = $1"'; });
    content = content.replace(/VALUES\s*\([^)]+\)"\s*:/g, (match) => { fixCount++; return match.replace(':"', '"'); });
    
    // Fix destructuring patterns
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*(\w+);/g, (match, p1, p2) => { fixCount++; return `const { ${p1} } = ${p2};`; });
    
    // Fix else patterns
    content = content.replace(/\}\s*else:\s*\{/g, () => { fixCount++; return '} else {'; });
    content = content.replace(/\}\s*else:\s*if/g, () => { fixCount++; return '} else if'; });
    
    // Fix do-while patterns
    content = content.replace(/\bdo:\s*\{/g, () => { fixCount++; return 'do {'; });
    
    // Fix finally patterns
    content = content.replace(/\}\s*finally:\s*\{/g, () => { fixCount++; return '} finally {'; });
    
    // Additional aggressive fixes for common patterns
    content = content.replace(/:\s+=/g, () => { fixCount++; return ' ='; });
    content = content.replace(/;\s+=/g, () => { fixCount++; return ' ='; });
    content = content.replace(/\)\s*:\s*=>/g, () => { fixCount++; return ') =>'; });
    content = content.replace(/\)\s*;\s*=>/g, () => { fixCount++; return ') =>'; });
    
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
console.log('🚀 Starting MASSIVE TypeScript fix operation...\n');

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
console.log('✨ MASSIVE FIX OPERATION COMPLETE!');
console.log('='.repeat(60));
console.log(`📊 Statistics:`);
console.log(`   Total files processed: ${files.length}`);
console.log(`   Files with fixes: ${filesFixed}`);
console.log(`   Total fixes applied: ${totalFixes}`);
console.log('='.repeat(60));