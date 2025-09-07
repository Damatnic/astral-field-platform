#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
console.log('🚀 Starting AI Suite Production Deployment');
console.log('==========================================');
// Configuration
const deploymentSteps = [
  {
    name: 'Environment Validation',
    command: 'node scripts/validate-environment.js',
    required: true
  },
  {
    name: 'Build Optimization',
    command: 'npm run build',
    required: true
  },
  {
    name: 'Type Checking',
    command: 'npm run type-check',
    required: true
  },
  {
    name: 'Linting'command: 'npm run lint',
    required: true
  },
  {
    name: 'Testing'command: 'npm test',
    required: false // Can continue with warnings
  },
  {
    name: 'Database Migration',
    command: 'node scripts/run-production-migrations.js',
    required: true
  },
  {
    name: 'AI Services Health Check',
    command: 'node scripts/verify-ai-services.js',
    required: true
  },
  {
    name: 'Performance Validation',
    command: 'node scripts/validate-performance.js',
    required: false
  },
  {
    name: 'Deploy to Production',
    command: 'npx vercel --prod',
    required: true
  },
  {
    name: 'Post-Deploy Health Check',
    command: 'node scripts/post-deploy-validation.js',
    required: true
  }
];
async function runDeploymentStep(step) {
  console.log(`\n📋 ${step.name}`);
  console.log('-'.repeat(50));
  try {
    const startTime = Date.now();
    if (step.command) {
      execSync(step.command, { 
        stdio: 'inherit'timeout: 300000 // 5 minute timeout
      });
    }
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${step.name} completed in ${duration}s`);
    return { success: trueduration };
  } catch (error) {
    console.error(`❌ ${step.name} failed: `error.message);
    if (step.required) {
      console.error('🛑 Deployment stopped due to critical failure');
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing deployment with warnings');
      return { success: false, error: error.message };
    }
  }
}
function validateDeploymentPrerequisites() {
  console.log('🔍 Validating deployment prerequisites...');
  // Check if required environment variables are set
  const requiredEnvVars = [
    'NEON_DATABASE_URL',
    'DEEPSEEK_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'NEXTAUTH_SECRET'
  ];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables: 'missingVars);
    console.error('Please set these variables in your .env.production file');
    process.exit(1);
  }
  // Check if required files exist
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.js',
    'tsconfig.json'
  ];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files: 'missingFiles);
    process.exit(1);
  }
  console.log('✅ Prerequisites validated');
}
function generateDeploymentReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    deploymentId: `deploy_${Date.now()}`totalSteps: results.lengthsuccessfulSteps: results.filter(r => r.success).length,
    failedSteps: results.filter(r => !r.success).length,
    totalDuration: results.reduce((sumr) => sum + (r.duration || 0), 0),
    steps: results
  };
  const reportPath = path.join(__dirname, '..', 'deployment-reports', `${report.deploymentId}.json`);
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n📊 Deployment Report');
  console.log('===================');
  console.log(`Deployment ID: ${report.deploymentId}`);
  console.log(`Total Steps: ${report.totalSteps}`);
  console.log(`Successful: ${report.successfulSteps}`);
  console.log(`Failed: ${report.failedSteps}`);
  console.log(`Total Duration: ${report.totalDuration.toFixed(2)}s`);
  console.log(`Report saved: ${reportPath}`);
  return report;
}
async function main() {
  try {
    validateDeploymentPrerequisites();
    const results = [];
    const startTime = Date.now();
    for (const step of deploymentSteps) {
      const result = await runDeploymentStep(step);
      result.stepName = step.name;
      results.push(result);
    }
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Deployment completed in ${totalDuration}s`);
    const report = generateDeploymentReport(results);
    if (report.failedSteps > 0) {
      console.warn(`⚠️  Deployment completed with ${report.failedSteps} warnings`);
      console.log('Please review the deployment report for details');
    } else {
      console.log('✅ All deployment steps completed successfully!');
    }
    console.log('\n🔗 Next Steps:');
    console.log('- Monitor application health and performance');
    console.log('- Verify AI services are functioning correctly');
    console.log('- Run user acceptance testing');
    console.log('- Update documentation with production URLs');
  } catch (error) {
    console.error('💥 Deployment failed: 'error);
    process.exit(1);
  }
}
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment interrupted by user');
  process.exit(1);
});
process.on('SIGTERM', () => {
  console.log('\n🛑 Deployment terminated');
  process.exit(1);
});
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal deployment error: 'error);
    process.exit(1);
  });
}
module.exports = { runDeploymentStep, generateDeploymentReport };