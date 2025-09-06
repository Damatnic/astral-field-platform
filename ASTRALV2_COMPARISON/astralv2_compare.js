#!/usr/bin/env node

/**
 * Automated AstralDraftv2 vs Current Project Comparison Tool
 * Analyzes both codebases and generates detailed comparison reports
 */

const fs = require('fs');
const path = require('path');

class ProjectComparator {
  constructor() {
    this.astralV2Path = 'C:\\Users\\damat\\Downloads\\AstralDraftv2-master';
    this.currentProjectPath = process.cwd();
    this.results = {
      astralV2Features: [],
      currentFeatures: [],
      missingFeatures: [],
      betterImplementations: [],
      componentComparison: [],
      apiComparison: [],
      techStackComparison: {}
    };
  }

  async analyzeProjects() {
    console.log('🔍 Starting comprehensive project comparison...');
    console.log(`AstralV2 Path: ${this.astralV2Path}`);
    console.log(`Current Project: ${this.currentProjectPath}`);

    try {
      // Analyze both projects
      await this.analyzeAstralV2();
      await this.analyzeCurrentProject();
      
      // Compare features
      this.compareFeatures();
      this.compareComponents();
      this.compareAPIs();
      this.compareTechStack();
      
      // Generate reports
      this.generateJSONReport();
      this.generateMarkdownReport();
      this.generatePriorityReport();
      
      console.log('✅ Analysis complete! Check ASTRALV2_COMPARISON/ directory for reports.');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      console.log('Note: Make sure AstralDraftv2-master is extracted to the specified path.');
    }
  }

  async analyzeAstralV2() {
    console.log('📂 Analyzing AstralDraftv2 structure...');
    
    if (!fs.existsSync(this.astralV2Path)) {
      throw new Error(`AstralV2 path not found: ${this.astralV2Path}`);
    }

    // Key directories to analyze
    const keyDirs = [
      'src/components',
      'src/pages', 
      'src/api',
      'src/hooks',
      'src/utils',
      'src/services'
    ];

    for (const dir of keyDirs) {
      const fullPath = path.join(this.astralV2Path, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, 'astralV2');
      }
    }

    // Analyze package.json
    this.analyzePackageJson(this.astralV2Path, 'astralV2');
  }

  async analyzeCurrentProject() {
    console.log('📂 Analyzing current project structure...');

    const keyDirs = [
      'src/components',
      'src/app',
      'src/services',
      'src/hooks',
      'src/utils',
      'src/lib'
    ];

    for (const dir of keyDirs) {
      const fullPath = path.join(this.currentProjectPath, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, 'current');
      }
    }

    // Analyze package.json
    this.analyzePackageJson(this.currentProjectPath, 'current');
  }

  scanDirectory(dirPath, projectType) {
    const files = this.getAllFiles(dirPath, ['.js', '.jsx', '.ts', '.tsx']);
    
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(projectType === 'astralV2' ? this.astralV2Path : this.currentProjectPath, filePath);
      
      // Extract features from file content
      const features = this.extractFeatures(content, relativePath);
      
      if (projectType === 'astralV2') {
        this.results.astralV2Features.push(...features);
      } else {
        this.results.currentFeatures.push(...features);
      }
    });
  }

  getAllFiles(dirPath, extensions) {
    let files = [];
    
    if (!fs.existsSync(dirPath)) return files;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .git, dist, etc.
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            files = files.concat(this.getAllFiles(fullPath, extensions));
          }
        } else {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return files;
  }

  extractFeatures(content, filePath) {
    const features = [];
    
    // Extract React components
    const componentRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+|function\s+|const\s+)([A-Z][a-zA-Z0-9]+)(?:\s*=|\s*\()/g;
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      features.push({
        type: 'component',
        name: match[1],
        file: filePath,
        category: this.categorizeComponent(match[1], filePath)
      });
    }
    
    // Extract API routes
    if (filePath.includes('api') || filePath.includes('route')) {
      const apiMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      apiMethods.forEach(method => {
        if (content.includes(`export async function ${method}`) || 
            content.includes(`app.${method.toLowerCase()}`) ||
            content.includes(`router.${method.toLowerCase()}`)) {
          features.push({
            type: 'api',
            name: `${method} ${this.extractRouteFromPath(filePath)}`,
            file: filePath,
            method: method
          });
        }
      });
    }
    
    // Extract hooks
    const hookRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+|const\s+)(use[A-Z][a-zA-Z0-9]+)/g;
    while ((match = hookRegex.exec(content)) !== null) {
      features.push({
        type: 'hook',
        name: match[1],
        file: filePath
      });
    }
    
    // Extract key functions/services
    const functionRegex = /(?:export\s+(?:const|function)\s+)([a-zA-Z][a-zA-Z0-9]+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      if (!match[1].startsWith('use') && !match[1].match(/^[A-Z]/)) {
        features.push({
          type: 'function',
          name: match[1],
          file: filePath,
          category: this.categorizeFunction(match[1], filePath)
        });
      }
    }
    
    return features;
  }

  categorizeComponent(componentName, filePath) {
    const name = componentName.toLowerCase();
    const path = filePath.toLowerCase();
    
    if (path.includes('draft') || name.includes('draft')) return 'draft';
    if (path.includes('trade') || name.includes('trade')) return 'trade';
    if (path.includes('roster') || name.includes('roster') || name.includes('lineup')) return 'roster';
    if (path.includes('player') || name.includes('player')) return 'player';
    if (path.includes('league') || name.includes('league')) return 'league';
    if (path.includes('auth') || name.includes('auth') || name.includes('login')) return 'auth';
    if (path.includes('dashboard') || name.includes('dashboard')) return 'dashboard';
    if (path.includes('notification') || name.includes('notification')) return 'notification';
    if (path.includes('chat') || name.includes('chat') || name.includes('oracle')) return 'ai';
    if (path.includes('ui') || name.includes('button') || name.includes('modal')) return 'ui';
    
    return 'other';
  }

  categorizeFunction(functionName, filePath) {
    const name = functionName.toLowerCase();
    const path = filePath.toLowerCase();
    
    if (path.includes('api') || path.includes('service')) return 'api';
    if (path.includes('auth')) return 'auth';
    if (path.includes('util') || path.includes('helper')) return 'utility';
    if (path.includes('validation')) return 'validation';
    
    return 'business-logic';
  }

  extractRouteFromPath(filePath) {
    // Extract API route from file path
    const parts = filePath.split(path.sep);
    const apiIndex = parts.findIndex(part => part === 'api');
    
    if (apiIndex !== -1) {
      return '/' + parts.slice(apiIndex).join('/').replace(/\\.(js|ts|jsx|tsx)$/, '');
    }
    
    return filePath;
  }

  analyzePackageJson(projectPath, projectType) {
    const packagePath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      console.warn(`⚠️ No package.json found in ${projectPath}`);
      return;
    }
    
    try {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      this.results.techStackComparison[projectType] = {
        dependencies: packageContent.dependencies || {},
        devDependencies: packageContent.devDependencies || {},
        scripts: packageContent.scripts || {},
        version: packageContent.version
      };
    } catch (error) {
      console.warn(`⚠️ Error reading package.json for ${projectType}:`, error.message);
    }
  }

  compareFeatures() {
    console.log('🔍 Comparing features...');
    
    const astralV2ComponentNames = this.results.astralV2Features
      .filter(f => f.type === 'component')
      .map(f => f.name.toLowerCase());
    
    const currentComponentNames = this.results.currentFeatures
      .filter(f => f.type === 'component')
      .map(f => f.name.toLowerCase());

    // Find missing components
    astralV2ComponentNames.forEach(name => {
      if (!currentComponentNames.includes(name)) {
        const originalFeature = this.results.astralV2Features.find(
          f => f.type === 'component' && f.name.toLowerCase() === name
        );
        this.results.missingFeatures.push({
          type: 'component',
          name: originalFeature.name,
          file: originalFeature.file,
          category: originalFeature.category,
          priority: this.calculatePriority(originalFeature)
        });
      }
    });

    // Compare API endpoints
    const astralV2APIs = this.results.astralV2Features.filter(f => f.type === 'api');
    const currentAPIs = this.results.currentFeatures.filter(f => f.type === 'api');
    
    astralV2APIs.forEach(api => {
      const hasEquivalent = currentAPIs.some(current => 
        current.name.includes(api.name.split(' ')[1]) // Compare route paths
      );
      
      if (!hasEquivalent) {
        this.results.missingFeatures.push({
          ...api,
          priority: this.calculatePriority(api)
        });
      }
    });
  }

  calculatePriority(feature) {
    const highPriorityKeywords = ['draft', 'trade', 'auth', 'player', 'league', 'oracle', 'chat'];
    const mediumPriorityKeywords = ['notification', 'dashboard', 'roster', 'lineup'];
    
    const featureText = (feature.name + ' ' + feature.file + ' ' + (feature.category || '')).toLowerCase();
    
    if (highPriorityKeywords.some(keyword => featureText.includes(keyword))) {
      return 'P0';
    }
    
    if (mediumPriorityKeywords.some(keyword => featureText.includes(keyword))) {
      return 'P1';
    }
    
    return 'P2';
  }

  compareComponents() {
    // Group features by category for detailed comparison
    const categories = ['draft', 'trade', 'roster', 'player', 'league', 'auth', 'ai'];
    
    categories.forEach(category => {
      const astralV2Components = this.results.astralV2Features.filter(
        f => f.type === 'component' && f.category === category
      );
      const currentComponents = this.results.currentFeatures.filter(
        f => f.type === 'component' && f.category === category
      );
      
      this.results.componentComparison.push({
        category,
        astralV2Count: astralV2Components.length,
        currentCount: currentComponents.length,
        astralV2Components: astralV2Components.map(c => c.name),
        currentComponents: currentComponents.map(c => c.name),
        missing: astralV2Components.filter(a => 
          !currentComponents.some(c => c.name.toLowerCase().includes(a.name.toLowerCase()))
        ).map(c => c.name)
      });
    });
  }

  compareAPIs() {
    const astralV2APIs = this.results.astralV2Features.filter(f => f.type === 'api');
    const currentAPIs = this.results.currentFeatures.filter(f => f.type === 'api');
    
    this.results.apiComparison = {
      astralV2Count: astralV2APIs.length,
      currentCount: currentAPIs.length,
      astralV2APIs: astralV2APIs.map(api => api.name),
      currentAPIs: currentAPIs.map(api => api.name)
    };
  }

  compareTechStack() {
    const astralV2 = this.results.techStackComparison.astralV2;
    const current = this.results.techStackComparison.current;
    
    if (!astralV2 || !current) return;
    
    // Find missing dependencies
    Object.keys(astralV2.dependencies).forEach(dep => {
      if (!current.dependencies[dep]) {
        this.results.missingFeatures.push({
          type: 'dependency',
          name: dep,
          version: astralV2.dependencies[dep],
          priority: 'P2'
        });
      }
    });
  }

  generateJSONReport() {
    const outputDir = path.join(this.currentProjectPath, 'ASTRALV2_COMPARISON');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      fs.writeFileSync(
        path.join(outputDir, 'comparison_results.json'),
        JSON.stringify(this.results, null, 2)
      );
    } catch (error) {
      console.error('Error writing JSON report:', error.message);
    }
    
    console.log('📄 Generated: comparison_results.json');
  }

  generateMarkdownReport() {
    const outputDir = path.join(this.currentProjectPath, 'ASTRALV2_COMPARISON');
    
    let markdown = `# 📊 Automated Project Comparison Report\\n\\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\\n\\n`;
    
    // Summary
    markdown += `## 📈 Summary\\n\\n`;
    markdown += `| Metric | AstralV2 | Current Project | Status |\\n`;
    markdown += `|--------|----------|----------------|---------|\\n`;
    markdown += `| Components | ${this.results.astralV2Features.filter(f => f.type === 'component').length} | ${this.results.currentFeatures.filter(f => f.type === 'component').length} | ${this.getStatusIcon('components')} |\\n`;
    markdown += `| API Endpoints | ${this.results.astralV2Features.filter(f => f.type === 'api').length} | ${this.results.currentFeatures.filter(f => f.type === 'api').length} | ${this.getStatusIcon('api')} |\\n`;
    markdown += `| Missing Features | ${this.results.missingFeatures.length} | - | ⚠️ |\\n\\n`;
    
    // Missing Features by Priority
    markdown += `## 🚨 Missing Features by Priority\\n\\n`;
    
    ['P0', 'P1', 'P2'].forEach(priority => {
      const features = this.results.missingFeatures.filter(f => f.priority === priority);
      if (features.length > 0) {
        markdown += `### ${priority} Features (${features.length})\\n\\n`;
        features.forEach(feature => {
          markdown += `- **${feature.name}** (${feature.type})\\n`;
          markdown += `  - File: \`${feature.file}\`\\n`;
          markdown += `  - Category: ${feature.category || 'N/A'}\\n\\n`;
        });
      }
    });
    
    // Component Comparison by Category
    markdown += `## 🏗️ Component Comparison by Category\\n\\n`;
    this.results.componentComparison.forEach(cat => {
      markdown += `### ${cat.category.toUpperCase()}\\n`;
      markdown += `- AstralV2: ${cat.astralV2Count} components\\n`;
      markdown += `- Current: ${cat.currentCount} components\\n`;
      if (cat.missing.length > 0) {
        markdown += `- Missing: ${cat.missing.join(', ')}\\n`;
      }
      markdown += `\\n`;
    });
    
    try {
      fs.writeFileSync(
        path.join(outputDir, 'automated_comparison.md'),
        markdown
      );
    } catch (error) {
      console.error('Error writing markdown report:', error.message);
    }
    
    console.log('📄 Generated: automated_comparison.md');
  }

  generatePriorityReport() {
    const outputDir = path.join(this.currentProjectPath, 'ASTRALV2_COMPARISON');
    
    const p0Features = this.results.missingFeatures.filter(f => f.priority === 'P0');
    
    let report = `# 🎯 Priority Implementation Report\\n\\n`;
    report += `## Immediate Action Required (${p0Features.length} features)\\n\\n`;
    
    p0Features.forEach((feature, index) => {
      report += `### ${index + 1}. ${feature.name}\\n`;
      report += `- **Type:** ${feature.type}\\n`;
      report += `- **Category:** ${feature.category || 'N/A'}\\n`;
      report += `- **Priority:** ${feature.priority}\\n`;
      report += `- **Estimated Time:** ${this.estimateImplementationTime(feature)}\\n`;
      report += `- **Implementation Approach:**\\n`;
      report += this.generateImplementationHint(feature);
      report += `\\n\\n`;
    });
    
    try {
      fs.writeFileSync(
        path.join(outputDir, 'priority_implementation.md'),
        report
      );
    } catch (error) {
      console.error('Error writing priority report:', error.message);
    }
    
    console.log('📄 Generated: priority_implementation.md');
  }

  getStatusIcon(type) {
    const astralCount = this.results.astralV2Features.filter(f => f.type === (type === 'components' ? 'component' : type)).length;
    const currentCount = this.results.currentFeatures.filter(f => f.type === (type === 'components' ? 'component' : type)).length;
    
    if (currentCount >= astralCount) return '✅';
    if (currentCount >= astralCount * 0.5) return '⚠️';
    return '❌';
  }

  estimateImplementationTime(feature) {
    const timeEstimates = {
      component: {
        draft: '2-3 days',
        trade: '1-2 days',
        ai: '1-2 days',
        auth: '1 day',
        player: '4-6 hours',
        ui: '2-4 hours'
      },
      api: '4-8 hours',
      function: '2-4 hours',
      dependency: '1-2 hours'
    };
    
    if (feature.type === 'component' && feature.category) {
      return timeEstimates.component[feature.category] || '4-8 hours';
    }
    
    return timeEstimates[feature.type] || '4-8 hours';
  }

  generateImplementationHint(feature) {
    const hints = {
      draft: '  ```typescript\\n  // Create WebSocket-powered draft room\\n  // Implement real-time pick tracking\\n  // Add draft timer component\\n  ```\\n',
      trade: '  ```typescript\\n  // Add trade proposal system\\n  // Implement trade analyzer\\n  // Create trade history tracking\\n  ```\\n',
      ai: '  ```typescript\\n  // Integrate OpenAI/Gemini API\\n  // Create chat interface\\n  // Add fantasy-specific prompts\\n  ```\\n',
      auth: '  ```typescript\\n  // Enhance existing auth system\\n  // Add MFA capabilities\\n  // Implement session management\\n  ```\\n'
    };
    
    return hints[feature.category] || '  ```typescript\\n  // Implementation needed\\n  ```\\n';
  }
}

// Run comparison if called directly
if (require.main === module) {
  const comparator = new ProjectComparator();
  comparator.analyzeProjects().catch(console.error);
}

module.exports = ProjectComparator;