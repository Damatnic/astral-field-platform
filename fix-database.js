const fs = require('fs');

// Fix the malformed database.ts file
const filePath = 'src/types/database.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the pattern where we have "string;,\n    propname" - should be "string;\n          propname"
content = content.replace(/(\w+): (string|number|boolean|Json|null|undefined);,\n\s+/g, (match, prop, type) => {
  return `${prop}: ${type};\n          `;
});

// Fix where we have just ";,\n" 
content = content.replace(/;,\n/g, ';\n');

// Fix patterns like "id: string;,\n    league_id: string;" 
content = content.replace(/: ([^;]+);,(\s*)/g, ': $1;$2');

// Fix patterns like "week: number;,\n    season_year: number;"
content = content.replace(/(\w+): (\w+(\s*\|\s*\w+)*(\[\])?);,/g, '$1: $2;');

// Fix Row/Insert/Update object commas
content = content.replace(/;,\s*(\w+):/g, ';\n          $1:');

// Fix specific patterns in type definitions
content = content.replace(/(\w+)\?: (string|number|boolean|Json)(\s*\|\s*null)?;,/g, '$1?: $2$3;');

// Fix any remaining double commas
content = content.replace(/,,/g, ',');

// Fix patterns where property on new line after comma
content = content.replace(/,\n\s+(\w+): /g, ';\n          $1: ');

// Fix the Tables type parameters
content = content.replace(/Tables<T extends keyof,\s*Database/g, 'Tables<T extends keyof Database');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed database.ts');