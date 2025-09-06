#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Build Process...\n');

// Build steps
const buildSteps = [
  {
    name: 'Environment Validation',
    command: 'node scripts/validate-env.js',
    description: 'Validating production environment variables'
  },
  {
    name: 'Code Quality Checks',
    command: 'npm run lint',
    description: 'Running ESLint checks'
  },
  {
    name: 'Type Checking',
    command: 'npm run type-check',
    description: 'TypeScript type checking'
  },
  {
    name: 'Security Scan',
    command: 'npm audit --audit-level=high',
    description: 'Scanning for security vulnerabilities'
  },
  {
    name: 'Test Suite',
    command: 'npm run test -- --coverage --watchAll=false',
    description: 'Running comprehensive test suite'
  },
  {
    name: 'Build Application',
    command: 'next build',
    description: 'Building Next.js application'
  },
  {
    name: 'Bundle Analysis',
    command: 'npm run analyze',
    description: 'Analyzing bundle size'
  }
];

// Execute build steps
let currentStep = 0;
for (const step of buildSteps) {
  currentStep++;
  console.log(`\n📋 Step ${currentStep}/${buildSteps.length}: ${step.name}`);
  console.log(`   ${step.description}`);
  
  try {
    const startTime = Date.now();
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`   ✅ Completed in ${duration.toFixed(1)}s`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

// Post-build optimizations
console.log('\n🔧 Post-Build Optimizations...');

try {
  // Generate build report
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: 'production',
    nodeVersion: process.version,
    buildDuration: Date.now() - process.hrtime.bigint() / 1000000n
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), '.next', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('   ✅ Build report generated');
  
  // Verify critical files exist
  const criticalFiles = [
    '.next/server/pages/api/auth/mfa/route.js',
    '.next/server/chunks/webpack.js',
    '.next/static/chunks/pages/index.js'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      throw new Error(`Critical file missing: ${file}`);
    }
  }
  
  console.log('   ✅ Critical files verified');
  
} catch (error) {
  console.error(`   ❌ Post-build optimization failed: ${error.message}`);
  process.exit(1);
}

console.log('\n🎉 Production Build Complete!');
console.log('\n📊 Build Summary:');
console.log(`   • Environment: Production`);
console.log(`   • Version: ${buildInfo.version}`);
console.log(`   • Node Version: ${process.version}`);
console.log(`   • Build Time: ${new Date().toLocaleString()}`);
console.log('\n✅ Ready for deployment!');

// Display next steps
console.log('\n📋 Next Steps:');
console.log('   1. Deploy to staging: npm run deploy:staging');
console.log('   2. Run E2E tests: npm run e2e:production');
console.log('   3. Deploy to production: npm run deploy:production');
console.log('   4. Monitor deployment: npm run monitor:production');