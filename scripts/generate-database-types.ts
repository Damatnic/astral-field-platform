#!/usr/bin/env tsx

/**
 * Database Type Generation Utility
 * 
 * This utility helps keep TypeScript database types in sync with the actual database schema.
 * It can be used to generate types from the consolidated schema or validate existing types.
 * 
 * Usage:
 *   npm run db:generate-types
 *   npm run db:validate-types
 */

import fs from 'fs';
import path from 'path';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
  comment?: string;
}

/**
 * Parse SQL schema file to extract table definitions
 */
function parseSchemaFile(schemaPath: string): TableSchema[] {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const tables: TableSchema[] = [];
  
  // Extract CREATE TABLE statements
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/g;
  let match;
  
  while ((match = tableRegex.exec(schemaContent)) !== null) {
    const tableName = match[1];
    const tableDefinition = match[2];
    
    const columns = parseTableColumns(tableDefinition);
    
    tables.push({
      name: tableName,
      columns,
      comment: extractTableComment(schemaContent, tableName)
    });
  }
  
  return tables;
}

/**
 * Parse column definitions from a table
 */
function parseTableColumns(tableDefinition: string): TableColumn[] {
  const columns: TableColumn[] = [];
  
  // Split by lines and clean up
  const lines = tableDefinition
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('--') && !line.startsWith('UNIQUE') && !line.startsWith('CONSTRAINT'));
  
  for (const line of lines) {
    if (line.includes(' ')) {
      const column = parseColumnDefinition(line);
      if (column) {
        columns.push(column);
      }
    }
  }
  
  return columns;
}

/**
 * Parse a single column definition
 */
function parseColumnDefinition(definition: string): TableColumn | null {
  // Remove trailing comma
  const cleanDef = definition.replace(/,$/, '').trim();
  
  // Skip constraints
  if (cleanDef.startsWith('UNIQUE') || cleanDef.startsWith('CONSTRAINT') || cleanDef.startsWith('CHECK')) {
    return null;
  }
  
  const parts = cleanDef.split(/\s+/);
  if (parts.length < 2) return null;
  
  const columnName = parts[0];
  const columnType = parts[1];
  
  // Check for modifiers
  const nullable = !cleanDef.includes('NOT NULL');
  const primaryKey = cleanDef.includes('PRIMARY KEY');
  
  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = cleanDef.match(/DEFAULT\s+([^,\s]+(?:\s+[^,\s]+)*)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }
  
  // Extract foreign key
  let foreignKey: { table: string; column: string } | undefined;
  const foreignKeyMatch = cleanDef.match(/REFERENCES\s+(\w+)\((\w+)\)/);
  if (foreignKeyMatch) {
    foreignKey = {
      table: foreignKeyMatch[1],
      column: foreignKeyMatch[2]
    };
  }
  
  return {
    name: columnName,
    type: mapSqlTypeToTypescript(columnType),
    nullable,
    primaryKey,
    defaultValue,
    foreignKey
  };
}

/**
 * Map SQL types to TypeScript types
 */
function mapSqlTypeToTypescript(sqlType: string): string {
  const type = sqlType.toLowerCase();
  
  if (type.includes('uuid') || type.includes('text') || type.includes('varchar') || type.includes('char')) {
    return 'string';
  }
  
  if (type.includes('int') || type.includes('serial') || type.includes('numeric') || type.includes('decimal')) {
    return 'number';
  }
  
  if (type.includes('bool')) {
    return 'boolean';
  }
  
  if (type.includes('timestamp') || type.includes('date') || type.includes('time')) {
    return 'string'; // Dates come as ISO strings from Supabase
  }
  
  if (type.includes('jsonb') || type.includes('json')) {
    return 'Json';
  }
  
  if (type.includes('[]')) {
    const baseType = mapSqlTypeToTypescript(type.replace('[]', ''));
    return `${baseType}[]`;
  }
  
  return 'unknown';
}

/**
 * Extract table comments from schema
 */
function extractTableComment(schemaContent: string, tableName: string): string | undefined {
  // Look for comments before the table definition
  const tablePosition = schemaContent.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  if (tablePosition === -1) return undefined;
  
  const beforeTable = schemaContent.substring(0, tablePosition);
  const lines = beforeTable.split('\n').reverse();
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') && !trimmed.includes('====')) {
      return trimmed.replace(/^--\s*/, '');
    }
    if (trimmed && !trimmed.startsWith('--')) {
      break;
    }
  }
  
  return undefined;
}

/**
 * Generate TypeScript interface for a table
 */
function generateTableInterface(table: TableSchema): string {
  const { name, columns, comment } = table;
  
  let output = '';
  
  if (comment) {
    output += `      // ${comment}\n`;
  }
  
  output += `      ${name}: {\n`;
  
  // Row type
  output += `        Row: {\n`;
  for (const column of columns) {
    const tsType = column.nullable ? `${column.type} | null` : column.type;
    output += `          ${column.name}: ${tsType};\n`;
  }
  output += `        };\n`;
  
  // Insert type
  output += `        Insert: {\n`;
  for (const column of columns) {
    const isOptional = column.defaultValue || column.primaryKey || column.nullable;
    const tsType = column.nullable ? `${column.type} | null` : column.type;
    const optional = isOptional ? '?' : '';
    output += `          ${column.name}${optional}: ${tsType};\n`;
  }
  output += `        };\n`;
  
  // Update type
  output += `        Update: {\n`;
  for (const column of columns) {
    const tsType = column.nullable ? `${column.type} | null` : column.type;
    output += `          ${column.name}?: ${tsType};\n`;
  }
  output += `        };\n`;
  
  output += `      };\n\n`;
  
  return output;
}

/**
 * Generate complete database interface
 */
function generateDatabaseTypes(tables: TableSchema[]): string {
  let output = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
`;

  for (const table of tables) {
    output += generateTableInterface(table);
  }

  output += `    };
    Views: {
      schema_health: {
        Row: {
          schema_version: string | null;
          total_tables: number | null;
          last_updated: string | null;
          status: string | null;
        };
      };
    };
    Functions: {
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type aliases for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
`;

  return output;
}

/**
 * Generate types from schema file
 */
function generateTypes() {
  const schemaPath = path.join(process.cwd(), 'db', 'complete-schema.sql');
  const outputPath = path.join(process.cwd(), 'src', 'types', 'database.generated.ts');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  
  console.log('📊 Parsing database schema...');
  const tables = parseSchemaFile(schemaPath);
  
  console.log(`✅ Found ${tables.length} tables`);
  
  console.log('🔧 Generating TypeScript types...');
  const typeContent = generateDatabaseTypes(tables);
  
  // Write to file
  fs.writeFileSync(outputPath, typeContent, 'utf-8');
  
  console.log(`✅ Generated types written to: ${outputPath}`);
  console.log('💡 Consider reviewing and updating your main database.ts file');
}

/**
 * Validate existing types against schema
 */
function validateTypes() {
  const schemaPath = path.join(process.cwd(), 'db', 'complete-schema.sql');
  const typesPath = path.join(process.cwd(), 'src', 'types', 'database.ts');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(typesPath)) {
    console.error(`Types file not found: ${typesPath}`);
    process.exit(1);
  }
  
  console.log('🔍 Validating types against schema...');
  
  const tables = parseSchemaFile(schemaPath);
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  
  const issues: string[] = [];
  
  for (const table of tables) {
    // Check if table exists in types
    const tableRegex = new RegExp(`${table.name}:\\s*{`, 'i');
    if (!tableRegex.test(typesContent)) {
      issues.push(`❌ Missing table: ${table.name}`);
      continue;
    }
    
    // Check columns (simplified validation)
    for (const column of table.columns) {
      const columnRegex = new RegExp(`${column.name}:\\s*${column.type}`, 'i');
      if (!columnRegex.test(typesContent)) {
        issues.push(`⚠️  Column type mismatch in ${table.name}.${column.name}: expected ${column.type}`);
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ All types are valid!');
  } else {
    console.log(`❌ Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`  ${issue}`));
  }
}

/**
 * Main entry point
 */
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
      generateTypes();
      break;
    case 'validate':
      validateTypes();
      break;
    default:
      console.log('Usage: tsx generate-database-types.ts [generate|validate]');
      console.log('  generate - Generate types from schema');
      console.log('  validate - Validate existing types against schema');
      break;
  }
}

if (require.main === module) {
  main();
}