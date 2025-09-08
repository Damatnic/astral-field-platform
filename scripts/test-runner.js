#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * Orchestrates different test types and generates unified reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Configuration
const TEST_TYPES = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test:coverage',
    timeout: 300000, // 5 minutes
    required: true,
  },
  integration: {
    name: 'Integration Tests', 
    command: 'npm run test:integration:coverage',
    timeout: 600000, // 10 minutes
    required: true,
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    timeout: 1800000, // 30 minutes
    required: true,
  },
  visual: {
    name: 'Visual Regression Tests',
    command: 'npx playwright test visual-tests/',
    timeout: 1200000, // 20 minutes
    required: false,
  },
  security: {
    name: 'Security Tests',
    command: 'k6 run security-tests/owasp-top10.test.js',
    timeout: 900000, // 15 minutes
    required: false,
  },
  load: {
    name: 'Load Tests',
    command: 'k6 run load-tests/scenarios/authentication.load.js',
    timeout: 600000, // 10 minutes
    required: false,
  },
};

const REPORT_DIR = './test-reports';
const LOG_DIR = './test-logs';

class TestRunner {
  constructor(options = {}) {
    this.options = {
      parallel: false,
      failFast: false,
      generateReport: true,
      verbose: false,
      testTypes: Object.keys(TEST_TYPES),
      ...options,
    };
    
    this.results = new Map();
    this.startTime = Date.now();
  }

  async run() {
    console.log(chalk.blue.bold('🚀 Starting Comprehensive Test Suite'));
    console.log(chalk.gray(`Test Types: ${this.options.testTypes.join(', ')}`));
    console.log(chalk.gray(`Parallel: ${this.options.parallel ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`Fail Fast: ${this.options.failFast ? 'Yes' : 'No'}`));
    console.log('');

    try {
      await this.setupEnvironment();
      
      if (this.options.parallel) {
        await this.runTestsInParallel();
      } else {
        await this.runTestsSequentially();
      }

      await this.generateReports();
      
      const summary = this.getSummary();
      this.printSummary(summary);
      
      // Exit with appropriate code
      process.exit(summary.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red.bold('❌ Test runner failed:'), error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async setupEnvironment() {
    console.log(chalk.yellow('🔧 Setting up test environment...'));
    
    // Create necessary directories
    await this.ensureDirectories([REPORT_DIR, LOG_DIR]);
    
    // Check prerequisites
    await this.checkPrerequisites();
    
    // Start services if needed
    await this.startServices();
    
    console.log(chalk.green('✅ Environment setup complete\n'));
  }

  async ensureDirectories(dirs) {
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async checkPrerequisites() {
    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'Docker', command: 'docker --version', optional: true },
      { name: 'k6', command: 'k6 version', optional: true },
      { name: 'Playwright', command: 'npx playwright --version', optional: true },
    ];

    for (const check of checks) {
      try {
        const version = execSync(check.command, { encoding: 'utf8' }).trim();
        console.log(chalk.green(`✅ ${check.name}: ${version}`));
      } catch (error) {
        if (check.optional) {
          console.log(chalk.yellow(`⚠️  ${check.name}: Not available (optional)`));
        } else {
          throw new Error(`${check.name} is required but not found`);
        }
      }
    }
  }

  async startServices() {
    // Start database if needed
    try {
      execSync('docker compose up -d postgres redis', { stdio: 'inherit' });
      console.log(chalk.green('✅ Started database services'));
      
      // Wait for services to be ready
      await this.waitForServices();
    } catch (error) {
      console.log(chalk.yellow('⚠️  Database services not started (may not be needed)'));
    }
  }

  async waitForServices() {
    const maxWait = 30000; // 30 seconds
    const interval = 2000; // 2 seconds
    let waited = 0;

    while (waited < maxWait) {
      try {
        execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
        execSync('redis-cli -h localhost -p 6379 ping', { stdio: 'ignore' });
        console.log(chalk.green('✅ Services are ready'));
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
        process.stdout.write('.');
      }
    }
    
    console.log(chalk.yellow('\n⚠️  Services may not be fully ready'));
  }

  async runTestsInParallel() {
    console.log(chalk.blue('🔄 Running tests in parallel...'));
    
    const promises = this.options.testTypes.map(type => this.runSingleTest(type));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const testType = this.options.testTypes[index];
      if (result.status === 'rejected') {
        this.results.set(testType, {
          ...TEST_TYPES[testType],
          status: 'failed',
          error: result.reason?.message || 'Unknown error',
          duration: 0,
        });
      }
    });
  }

  async runTestsSequentially() {
    console.log(chalk.blue('🔄 Running tests sequentially...'));
    
    for (const testType of this.options.testTypes) {
      try {
        await this.runSingleTest(testType);
        
        if (this.options.failFast && this.results.get(testType)?.status === 'failed') {
          console.log(chalk.red(`❌ Stopping due to ${testType} test failure (fail-fast mode)`));
          break;
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error running ${testType} tests:`, error.message));
        if (this.options.failFast) {
          throw error;
        }
      }
    }
  }

  async runSingleTest(testType) {
    const config = TEST_TYPES[testType];
    if (!config) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    console.log(chalk.blue(`\n🧪 Running ${config.name}...`));
    const startTime = Date.now();

    try {
      const result = await this.executeCommand(config.command, config.timeout);
      const duration = Date.now() - startTime;

      this.results.set(testType, {
        ...config,
        status: result.code === 0 ? 'passed' : 'failed',
        duration,
        output: result.output,
        error: result.error,
      });

      if (result.code === 0) {
        console.log(chalk.green(`✅ ${config.name} passed (${this.formatDuration(duration)})`));
      } else {
        console.log(chalk.red(`❌ ${config.name} failed (${this.formatDuration(duration)})`));
        if (this.options.verbose) {
          console.log(chalk.red('Error output:'), result.error);
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.set(testType, {
        ...config,
        status: 'failed',
        duration,
        error: error.message,
      });

      console.log(chalk.red(`❌ ${config.name} failed (${this.formatDuration(duration)})`));
      if (this.options.verbose) {
        console.log(chalk.red('Error:'), error.message);
      }
    }
  }

  executeCommand(command, timeout) {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      const child = spawn('bash', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CI: 'true' },
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        if (this.options.verbose) {
          process.stdout.write(chunk);
        }
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        if (this.options.verbose) {
          process.stderr.write(chunk);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({ code, output, error });
      });

      child.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  async generateReports() {
    if (!this.options.generateReport) {
      return;
    }

    console.log(chalk.yellow('\n📊 Generating test reports...'));

    try {
      // Generate JSON report
      const jsonReport = this.generateJsonReport();
      await fs.writeFile(
        path.join(REPORT_DIR, 'test-results.json'),
        JSON.stringify(jsonReport, null, 2)
      );

      // Generate HTML report
      const htmlReport = this.generateHtmlReport(jsonReport);
      await fs.writeFile(
        path.join(REPORT_DIR, 'test-results.html'),
        htmlReport
      );

      // Generate JUnit XML for CI systems
      const junitXml = this.generateJUnitReport(jsonReport);
      await fs.writeFile(
        path.join(REPORT_DIR, 'junit-results.xml'),
        junitXml
      );

      console.log(chalk.green('✅ Reports generated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate reports:'), error.message);
    }
  }

  generateJsonReport() {
    const summary = this.getSummary();
    
    return {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary,
      results: Array.from(this.results.entries()).map(([type, result]) => ({
        type,
        ...result,
      })),
      environment: {
        node: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
      },
    };
  }

  generateHtmlReport(jsonReport) {
    const { summary, results } = jsonReport;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #333; margin: 0 0 10px 0; }
        .subtitle { color: #666; margin: 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; text-transform: uppercase; font-size: 0.8em; letter-spacing: 1px; }
        .passed { background: #e8f5e8; border-left: 4px solid #28a745; }
        .failed { background: #fde8e8; border-left: 4px solid #dc3545; }
        .skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
        .duration { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .results-table th { background: #f8f9fa; font-weight: 600; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-skipped { color: #ffc107; font-weight: bold; }
        .error-details { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Comprehensive Test Results</h1>
            <p class="subtitle">Generated on ${new Date(jsonReport.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric passed">
                <div class="metric-value">${summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric failed">
                <div class="metric-value">${summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric skipped">
                <div class="metric-value">${summary.skipped}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric duration">
                <div class="metric-value">${this.formatDuration(jsonReport.duration)}</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>
        
        <table class="results-table">
            <thead>
                <tr>
                    <th>Test Type</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr>
                        <td>${result.name}</td>
                        <td><span class="status-${result.status}">${result.status.toUpperCase()}</span></td>
                        <td>${this.formatDuration(result.duration || 0)}</td>
                        <td>
                            ${result.error ? `<div class="error-details">${result.error}</div>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  generateJUnitReport(jsonReport) {
    const { summary, results } = jsonReport;
    
    const testCases = results.map(result => `
    <testcase classname="${result.type}" name="${result.name}" time="${(result.duration || 0) / 1000}">
        ${result.status === 'failed' ? `<failure message="Test failed">${result.error || 'Test failed'}</failure>` : ''}
        ${result.status === 'skipped' ? '<skipped/>' : ''}
    </testcase>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Comprehensive Tests" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${jsonReport.duration / 1000}">
${testCases}
</testsuite>`;
  }

  getSummary() {
    const results = Array.from(this.results.values());
    
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: this.options.testTypes.length - results.length,
      duration: Date.now() - this.startTime,
    };
  }

  printSummary(summary) {
    console.log('\n' + chalk.blue.bold('📊 Test Summary'));
    console.log('━'.repeat(50));
    
    const totalDuration = this.formatDuration(summary.duration);
    
    console.log(`${chalk.gray('Total:')}     ${summary.total}`);
    console.log(`${chalk.green('Passed:')}    ${summary.passed}`);
    console.log(`${chalk.red('Failed:')}    ${summary.failed}`);
    console.log(`${chalk.yellow('Skipped:')}   ${summary.skipped}`);
    console.log(`${chalk.blue('Duration:')}  ${totalDuration}`);
    
    if (summary.failed > 0) {
      console.log('\n' + chalk.red.bold('❌ Some tests failed:'));
      
      for (const [type, result] of this.results.entries()) {
        if (result.status === 'failed') {
          console.log(chalk.red(`  • ${result.name}`));
          if (result.error && this.options.verbose) {
            console.log(chalk.red(`    ${result.error}`));
          }
        }
      }
    } else {
      console.log('\n' + chalk.green.bold('🎉 All tests passed!'));
    }
    
    if (this.options.generateReport) {
      console.log('\n' + chalk.blue(`📋 Reports available in: ${REPORT_DIR}/`));
    }
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--parallel':
        options.parallel = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--types':
        options.testTypes = args[++i].split(',');
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  const runner = new TestRunner(options);
  await runner.run();
}

function printHelp() {
  console.log(`
${chalk.blue.bold('Comprehensive Test Runner')}

Usage: node scripts/test-runner.js [options]

Options:
  --parallel       Run tests in parallel
  --fail-fast      Stop on first failure
  --verbose        Show detailed output
  --no-report      Skip report generation
  --types <types>  Comma-separated list of test types to run
                   Available: ${Object.keys(TEST_TYPES).join(', ')}
  --help          Show this help message

Examples:
  node scripts/test-runner.js
  node scripts/test-runner.js --parallel --verbose
  node scripts/test-runner.js --types unit,integration
  node scripts/test-runner.js --fail-fast --no-report
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red.bold('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = { TestRunner, TEST_TYPES };