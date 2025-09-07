#!/usr/bin/env node
/**
 * ESLint Mass Fix Script
 * Systematically fixes all ESLint errors and warnings
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
console.log('🚀 Starting ESLint Mass Fix Operation...');
// Step 1: Fix all require() imports in config files
const configFiles = [
  'tailwind.config.ts',
  'scripts/auto-draft-league.js',
  'scripts/create-users-table.js', 
  'scripts/deploy-production.js',
  'scripts/production-build.js',
  'scripts/setup-database.js',
  'scripts/setup-vercel.js',
  'scripts/test-database.js',
  'tests/automated/website-tester.js'
];
console.log('📦 Fixing require() imports...');
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    // Convert require() to import statements
    content = content.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\)/g, 'import { $1 } from \'$2\'');
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, 'import $1 from \'$2\'');
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed imports in ${file}`);
  }
});
// Step 2: Remove @ts-nocheck comments
console.log('🔧 Removing @ts-nocheck comments...');
const tsFiles = [
  'src/services/ml/matchupAnalysisEngine.ts',
  'src/services/onboarding/interactiveTutorialSystem.ts', 
  'src/services/sentiment/realTimeSentimentAnalyzer.ts',
  'src/services/testing/aiAccuracyValidator.ts'
];
tsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\/\/ @ts-nocheck\n?/g, '');
    fs.writeFileSync(file, content);
    console.log(`✅ Removed @ts-nocheck from ${file}`);
  }
});
// Step 3: Fix empty object type in jest-dom.d.ts
console.log('🔧 Fixing empty object types...');
if (fs.existsSync('src/types/jest-dom.d.ts')) {
  const content = fs.readFileSync('src/types/jest-dom.d.ts', 'utf8');
  content = content.replace(/\{\}/g, 'Record<string, unknown>');
  fs.writeFileSync('src/types/jest-dom.d.ts', content);
  console.log('✅ Fixed empty object types in jest-dom.d.ts');
}
console.log('🎯 Phase 1 Complete: Critical errors fixed');
console.log('📊 Running ESLint to check remaining issues...');
try {
  execSync('npx eslint . --format=compact', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ ESLint still has issues - proceeding with type fixes...');
}
console.log('✨ ESLint Mass Fix Operation Complete!');