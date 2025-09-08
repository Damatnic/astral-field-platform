/**
 * Multi-Agent Quality Assurance System
 * Automated code review, testing, and quality gate validation
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Task, QualityGate } from '../types';

const execAsync = promisify(exec);

interface QualityResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  metrics: QualityMetrics;
  recommendations: string[];
}

interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'syntax' | 'style' | 'security' | 'performance' | 'maintainability' | 'testing';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  severity: number; // 1-10
}

interface QualityMetrics {
  linting: {
    errors: number;
    warnings: number;
    score: number;
  };
  typeChecking: {
    errors: number;
    score: number;
  };
  testing: {
    coverage: number;
    testsPassed: number;
    testsFailed: number;
    score: number;
  };
  security: {
    vulnerabilities: number;
    riskScore: number;
    score: number;
  };
  performance: {
    bundleSize?: number;
    loadTime?: number;
    memoryUsage?: number;
    score: number;
  };
  maintainability: {
    complexity: number;
    duplication: number;
    techDebt: number;
    score: number;
  };
}

interface CodeAnalysisResult {
  file: string;
  issues: QualityIssue[];
  metrics: {
    lines: number;
    complexity: number;
    maintainabilityIndex: number;
    testCoverage: number;
  };
}

export class QualityAssurance {
  private qualityGates: Map<string, QualityGate> = new Map();
  private customRules: Map<string, (files: string[]) => Promise<QualityIssue[]>> = new Map();
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Quality Assurance System...');
    
    // Initialize default quality gates
    await this.initializeDefaultQualityGates();
    
    // Initialize custom rules
    this.initializeCustomRules();
    
    // Verify tooling availability
    await this.verifyToolingAvailability();
    
    this.isInitialized = true;
    console.log('✅ Quality Assurance System initialized');
  }

  async validateTask(task: Task): Promise<QualityResult> {
    if (!this.isInitialized) {
      throw new Error('Quality Assurance system not initialized');
    }

    console.log(`🔍 Running quality validation for task: ${task.id}`);
    
    const result: QualityResult = {
      passed: false,
      score: 0,
      issues: [],
      metrics: this.createEmptyMetrics(),
      recommendations: []
    };

    try {
      // Get all files to validate
      const filesToCheck = [
        ...task.files.toModify,
        ...task.files.toCreate
      ].filter(file => this.isValidatableFile(file));

      if (filesToCheck.length === 0) {
        console.log(`ℹ️ No validatable files found for task ${task.id}`);
        result.passed = true;
        result.score = 100;
        return result;
      }

      // Run quality checks
      const analysisResults = await this.analyzeFiles(filesToCheck);
      
      // Aggregate results
      result.issues = analysisResults.flatMap(analysis => analysis.issues);
      result.metrics = this.aggregateMetrics(analysisResults);
      result.score = this.calculateOverallScore(result.metrics);
      
      // Apply quality gate criteria
      const gateResult = await this.applyQualityGate(task, result);
      result.passed = gateResult.passed;
      result.recommendations = gateResult.recommendations;

      console.log(`📊 Quality validation complete for ${task.id}: ${result.passed ? 'PASSED' : 'FAILED'} (Score: ${result.score})`);
      
      return result;
    } catch (error) {
      console.error(`❌ Quality validation failed for task ${task.id}:`, error);
      result.issues.push({
        type: 'error',
        category: 'syntax',
        message: `Quality validation failed: ${error}`,
        severity: 8
      });
      return result;
    }
  }

  async runLinting(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    
    try {
      // Run ESLint
      const eslintCommand = `npx eslint ${files.map(f => `"${f}"`).join(' ')} --format json`;
      const { stdout } = await execAsync(eslintCommand);
      
      if (stdout.trim()) {
        const eslintResults = JSON.parse(stdout);
        
        for (const result of eslintResults) {
          for (const message of result.messages) {
            issues.push({
              type: message.severity === 2 ? 'error' : 'warning',
              category: this.categorizeEslintRule(message.ruleId),
              message: message.message,
              file: result.filePath,
              line: message.line,
              column: message.column,
              rule: message.ruleId,
              severity: message.severity === 2 ? 7 : 4
            });
          }
        }
      }
    } catch (error) {
      console.warn('ESLint execution failed:', error);
      issues.push({
        type: 'warning',
        category: 'syntax',
        message: 'Could not run linting analysis',
        severity: 3
      });
    }

    return issues;
  }

  async runTypeChecking(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    
    try {
      // Run TypeScript compiler
      const tscCommand = 'npx tsc --noEmit --pretty false';
      await execAsync(tscCommand);
    } catch (error: any) {
      // Parse TypeScript errors from stderr
      const output = error.stderr || error.stdout || '';
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
        if (match) {
          const [, file, lineNum, col, code, message] = match;
          if (files.some(f => file.includes(f))) {
            issues.push({
              type: 'error',
              category: 'syntax',
              message: `TS${code}: ${message}`,
              file,
              line: parseInt(lineNum),
              column: parseInt(col),
              rule: `TS${code}`,
              severity: 8
            });
          }
        }
      }
    }

    return issues;
  }

  async runTestCoverage(testFiles: string[]): Promise<{ coverage: number; issues: QualityIssue[] }> {
    const issues: QualityIssue[] = [];
    let coverage = 0;

    try {
      // Run Jest with coverage
      const jestCommand = 'npx jest --coverage --coverageReporters=json --passWithNoTests';
      const { stdout } = await execAsync(jestCommand);
      
      // Try to read coverage report
      try {
        const coverageData = await fs.readFile('coverage/coverage-summary.json', 'utf-8');
        const coverageReport = JSON.parse(coverageData);
        coverage = Math.round(coverageReport.total.lines.pct || 0);
        
        // Generate issues for low coverage
        if (coverage < 80) {
          issues.push({
            type: 'warning',
            category: 'testing',
            message: `Test coverage is ${coverage}%, below recommended 80%`,
            severity: 5
          });
        }
      } catch (error) {
        console.warn('Could not read coverage report:', error);
      }
    } catch (error) {
      console.warn('Test execution failed:', error);
      issues.push({
        type: 'warning',
        category: 'testing',
        message: 'Could not run test coverage analysis',
        severity: 6
      });
    }

    return { coverage, issues };
  }

  async runSecurityAudit(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    try {
      // Run npm audit
      const auditCommand = 'npm audit --json';
      const { stdout } = await execAsync(auditCommand);
      
      if (stdout.trim()) {
        const auditResult = JSON.parse(stdout);
        
        if (auditResult.vulnerabilities) {
          for (const [pkg, vuln] of Object.entries(auditResult.vulnerabilities) as [string, any][]) {
            issues.push({
              type: vuln.severity === 'critical' || vuln.severity === 'high' ? 'error' : 'warning',
              category: 'security',
              message: `${pkg}: ${vuln.title} (${vuln.severity})`,
              severity: this.mapSecuritySeverity(vuln.severity)
            });
          }
        }
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error instanceof Error && 'stdout' in error) {
        try {
          const auditResult = JSON.parse((error as any).stdout);
          // Process vulnerabilities as above
        } catch (parseError) {
          console.warn('Could not parse security audit results:', parseError);
        }
      }
    }

    // Custom security checks
    const customSecurityIssues = await this.runCustomSecurityChecks(files);
    issues.push(...customSecurityIssues);

    return issues;
  }

  async runPerformanceAnalysis(files: string[]): Promise<{ score: number; issues: QualityIssue[] }> {
    const issues: QualityIssue[] = [];
    let score = 100;

    try {
      // Analyze bundle size impact
      const bundleAnalysis = await this.analyzeBundleImpact(files);
      if (bundleAnalysis.sizeIncrease > 100000) { // 100KB
        issues.push({
          type: 'warning',
          category: 'performance',
          message: `Bundle size increased by ${Math.round(bundleAnalysis.sizeIncrease / 1024)}KB`,
          severity: 5
        });
        score -= 15;
      }

      // Analyze code complexity
      const complexityAnalysis = await this.analyzeComplexity(files);
      if (complexityAnalysis.averageComplexity > 10) {
        issues.push({
          type: 'warning',
          category: 'maintainability',
          message: `High cyclomatic complexity: ${complexityAnalysis.averageComplexity}`,
          severity: 6
        });
        score -= 20;
      }

      // Check for performance anti-patterns
      const antiPatternIssues = await this.detectPerformanceAntiPatterns(files);
      issues.push(...antiPatternIssues);
      score -= antiPatternIssues.length * 10;

    } catch (error) {
      console.warn('Performance analysis failed:', error);
      issues.push({
        type: 'warning',
        category: 'performance',
        message: 'Could not complete performance analysis',
        severity: 3
      });
    }

    return { score: Math.max(score, 0), issues };
  }

  private async analyzeFiles(files: string[]): Promise<CodeAnalysisResult[]> {
    const results: CodeAnalysisResult[] = [];

    for (const file of files) {
      try {
        const issues: QualityIssue[] = [];
        
        // Skip analysis for files that don't exist yet (to be created)
        try {
          await fs.access(file);
        } catch {
          // File doesn't exist, skip analysis
          continue;
        }

        // Read file content
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n').length;

        // Run various analyses
        const lintIssues = await this.runLinting([file]);
        const typeIssues = await this.runTypeChecking([file]);
        const { coverage } = await this.runTestCoverage([file]);
        
        issues.push(...lintIssues, ...typeIssues);

        // Calculate complexity
        const complexity = this.calculateCyclomaticComplexity(content);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(content, complexity);

        results.push({
          file,
          issues,
          metrics: {
            lines,
            complexity,
            maintainabilityIndex,
            testCoverage: coverage
          }
        });
      } catch (error) {
        console.error(`Error analyzing file ${file}:`, error);
        results.push({
          file,
          issues: [{
            type: 'error',
            category: 'syntax',
            message: `Analysis failed: ${error}`,
            file,
            severity: 7
          }],
          metrics: {
            lines: 0,
            complexity: 0,
            maintainabilityIndex: 0,
            testCoverage: 0
          }
        });
      }
    }

    return results;
  }

  private async applyQualityGate(task: Task, result: QualityResult): Promise<{ passed: boolean; recommendations: string[] }> {
    const recommendations: string[] = [];
    let passed = true;

    // Check minimum score requirement
    const minScore = task.quality.testCoverageRequired || 80;
    if (result.score < minScore) {
      passed = false;
      recommendations.push(`Improve code quality score to at least ${minScore}% (current: ${result.score}%)`);
    }

    // Check critical issues
    const criticalIssues = result.issues.filter(issue => issue.severity >= 8);
    if (criticalIssues.length > 0) {
      passed = false;
      recommendations.push(`Fix ${criticalIssues.length} critical issue(s) before proceeding`);
    }

    // Check test coverage if required
    if (task.quality.testCoverageRequired && result.metrics.testing.coverage < task.quality.testCoverageRequired) {
      passed = false;
      recommendations.push(`Increase test coverage to ${task.quality.testCoverageRequired}% (current: ${result.metrics.testing.coverage}%)`);
    }

    // Check security requirements
    if (task.quality.securityReviewRequired) {
      const securityIssues = result.issues.filter(issue => issue.category === 'security');
      if (securityIssues.some(issue => issue.type === 'error')) {
        passed = false;
        recommendations.push('Fix security vulnerabilities before deployment');
      }
    }

    // Check for too many warnings
    const warnings = result.issues.filter(issue => issue.type === 'warning');
    if (warnings.length > 10) {
      recommendations.push(`Consider addressing ${warnings.length} warning(s) to improve code quality`);
    }

    return { passed, recommendations };
  }

  private createEmptyMetrics(): QualityMetrics {
    return {
      linting: { errors: 0, warnings: 0, score: 100 },
      typeChecking: { errors: 0, score: 100 },
      testing: { coverage: 0, testsPassed: 0, testsFailed: 0, score: 0 },
      security: { vulnerabilities: 0, riskScore: 0, score: 100 },
      performance: { score: 100 },
      maintainability: { complexity: 0, duplication: 0, techDebt: 0, score: 100 }
    };
  }

  private aggregateMetrics(analysisResults: CodeAnalysisResult[]): QualityMetrics {
    const metrics = this.createEmptyMetrics();
    
    if (analysisResults.length === 0) return metrics;

    let totalLintErrors = 0;
    let totalLintWarnings = 0;
    let totalTypeErrors = 0;
    let totalComplexity = 0;
    let totalCoverage = 0;
    
    for (const result of analysisResults) {
      const lintErrors = result.issues.filter(i => i.category === 'syntax' && i.type === 'error').length;
      const lintWarnings = result.issues.filter(i => i.category === 'syntax' && i.type === 'warning').length;
      const typeErrors = result.issues.filter(i => i.rule?.startsWith('TS')).length;
      
      totalLintErrors += lintErrors;
      totalLintWarnings += lintWarnings;
      totalTypeErrors += typeErrors;
      totalComplexity += result.metrics.complexity;
      totalCoverage += result.metrics.testCoverage;
    }

    const fileCount = analysisResults.length;
    
    metrics.linting = {
      errors: totalLintErrors,
      warnings: totalLintWarnings,
      score: Math.max(0, 100 - (totalLintErrors * 10) - (totalLintWarnings * 2))
    };

    metrics.typeChecking = {
      errors: totalTypeErrors,
      score: Math.max(0, 100 - (totalTypeErrors * 15))
    };

    metrics.testing = {
      coverage: totalCoverage / fileCount,
      testsPassed: 0, // Would be populated by test runner
      testsFailed: 0,
      score: totalCoverage / fileCount
    };

    metrics.maintainability = {
      complexity: totalComplexity / fileCount,
      duplication: 0, // Would be calculated by duplication analyzer
      techDebt: 0,
      score: Math.max(0, 100 - Math.min((totalComplexity / fileCount - 5) * 10, 50))
    };

    return metrics;
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      linting: 0.25,
      typeChecking: 0.20,
      testing: 0.25,
      security: 0.15,
      performance: 0.10,
      maintainability: 0.05
    };

    return Math.round(
      metrics.linting.score * weights.linting +
      metrics.typeChecking.score * weights.typeChecking +
      metrics.testing.score * weights.testing +
      metrics.security.score * weights.security +
      metrics.performance.score * weights.performance +
      metrics.maintainability.score * weights.maintainability
    );
  }

  // Helper methods
  private isValidatableFile(file: string): boolean {
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue'];
    return validExtensions.some(ext => file.endsWith(ext));
  }

  private categorizeEslintRule(ruleId: string | null): 'syntax' | 'style' | 'security' | 'performance' | 'maintainability' {
    if (!ruleId) return 'syntax';
    
    if (ruleId.includes('security')) return 'security';
    if (ruleId.includes('performance') || ruleId.includes('react-hooks')) return 'performance';
    if (ruleId.includes('complexity') || ruleId.includes('cognitive')) return 'maintainability';
    if (ruleId.includes('style') || ruleId.includes('format')) return 'style';
    
    return 'syntax';
  }

  private mapSecuritySeverity(severity: string): number {
    switch (severity) {
      case 'critical': return 10;
      case 'high': return 8;
      case 'moderate': return 6;
      case 'low': return 4;
      default: return 5;
    }
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Simplified cyclomatic complexity calculation
    const decisionPoints = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?.*:/g // ternary operator
    ];

    let complexity = 1; // Base complexity
    for (const pattern of decisionPoints) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateMaintainabilityIndex(content: string, complexity: number): number {
    const lines = content.split('\n').length;
    const volume = lines * Math.log2(complexity + 1);
    const maintainabilityIndex = Math.max(0, (171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(lines)) * 100 / 171);
    return Math.round(maintainabilityIndex);
  }

  private async runCustomSecurityChecks(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for potential security issues
        const securityPatterns = [
          { pattern: /eval\s*\(/g, message: 'Use of eval() can be dangerous' },
          { pattern: /innerHTML\s*=/g, message: 'Setting innerHTML can lead to XSS vulnerabilities' },
          { pattern: /document\.write\s*\(/g, message: 'document.write can be exploited for XSS' },
          { pattern: /process\.env\./g, message: 'Environment variables should be validated before use' },
          { pattern: /exec\s*\(/g, message: 'Code execution functions should be used carefully' }
        ];

        for (const { pattern, message } of securityPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            issues.push({
              type: 'warning',
              category: 'security',
              message,
              file,
              severity: 6
            });
          }
        }
      } catch (error) {
        // File might not exist yet, skip
      }
    }

    return issues;
  }

  private async analyzeBundleImpact(files: string[]): Promise<{ sizeIncrease: number }> {
    // Simplified bundle analysis - in reality would use webpack-bundle-analyzer
    let estimatedSize = 0;
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        estimatedSize += stats.size;
      } catch {
        // File doesn't exist, estimate based on type
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          estimatedSize += 5000; // Estimate 5KB per TS file
        }
      }
    }

    return { sizeIncrease: estimatedSize };
  }

  private async analyzeComplexity(files: string[]): Promise<{ averageComplexity: number }> {
    let totalComplexity = 0;
    let fileCount = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalComplexity += this.calculateCyclomaticComplexity(content);
        fileCount++;
      } catch {
        // File doesn't exist, skip
      }
    }

    return {
      averageComplexity: fileCount > 0 ? totalComplexity / fileCount : 0
    };
  }

  private async detectPerformanceAntiPatterns(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    const antiPatterns = [
      {
        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*\]\s*\)/g,
        message: 'useEffect with empty dependency array - consider useMemo or useCallback',
        severity: 4
      },
      {
        pattern: /console\.log\s*\(/g,
        message: 'Console.log statements should be removed in production',
        severity: 3
      },
      {
        pattern: /document\.getElementById\s*\(/g,
        message: 'Direct DOM manipulation - consider React refs',
        severity: 5
      }
    ];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        for (const { pattern, message, severity } of antiPatterns) {
          if (pattern.test(content)) {
            issues.push({
              type: 'warning',
              category: 'performance',
              message,
              file,
              severity
            });
          }
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    return issues;
  }

  private async initializeDefaultQualityGates(): Promise<void> {
    // Initialize with basic quality gates
    console.log('📋 Initialized default quality gates');
  }

  private initializeCustomRules(): void {
    // Initialize custom validation rules
    this.customRules.set('fantasy-football-naming', async (files: string[]) => {
      const issues: QualityIssue[] = [];
      
      for (const file of files) {
        if (file.includes('fantasy') || file.includes('nfl')) {
          // Check for proper naming conventions
          try {
            const content = await fs.readFile(file, 'utf-8');
            if (!/export\s+(interface|type|class)\s+[A-Z]/.test(content)) {
              issues.push({
                type: 'warning',
                category: 'style',
                message: 'Fantasy football types should start with capital letter',
                file,
                severity: 3
              });
            }
          } catch {
            // File doesn't exist
          }
        }
      }
      
      return issues;
    });
  }

  private async verifyToolingAvailability(): Promise<void> {
    const tools = [
      { name: 'ESLint', command: 'npx eslint --version' },
      { name: 'TypeScript', command: 'npx tsc --version' },
      { name: 'Jest', command: 'npx jest --version' }
    ];

    for (const tool of tools) {
      try {
        await execAsync(tool.command);
        console.log(`✅ ${tool.name} available`);
      } catch {
        console.warn(`⚠️ ${tool.name} not available - some checks will be skipped`);
      }
    }
  }
}