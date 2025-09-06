/**
 * Automated Website Testing Script for Astral Field
 * Tests all major functionality systematically
 */

const { chromium } = require('playwright')

class AstralFieldTester {
  constructor() {
    this.baseUrl = 'http://localhost:3007'
    this.browser = null
    this.page = null
    this.testResults = {
      passed: 0,
      failed: 0,
      issues: []
    }
  }

  async setup() {
    console.log('🚀 Starting Astral Field comprehensive testing...')
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI
      slowMo: 1000 // Slow down actions for demo
    })
    this.page = await this.browser.newPage()
    
    // Set viewport for desktop testing
    await this.page.setViewportSize({ width: 1920, height: 1080 })
    
    // Enable console logging
    this.page.on('console', msg => console.log('PAGE LOG:', msg.text()))
    
    // Track network errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.logIssue('high', `HTTP ${response.status()}: ${response.url()}`)
      }
    })
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close()
    }
    this.printResults()
  }

  logIssue(severity, message) {
    this.testResults.issues.push({ severity, message, timestamp: new Date().toISOString() })
    console.log(`❌ [${severity.toUpperCase()}] ${message}`)
  }

  logSuccess(message) {
    this.testResults.passed++
    console.log(`✅ ${message}`)
  }

  async testPage(url, pageName) {
    try {
      console.log(`\\n📄 Testing ${pageName}: ${url}`)
      await this.page.goto(url, { waitUntil: 'networkidle' })
      
      // Check for 404 or error pages
      const title = await this.page.title()
      if (title.includes('404') || title.includes('Error')) {
        this.logIssue('high', `Page ${pageName} shows error: ${title}`)
        return false
      }
      
      this.logSuccess(`${pageName} loaded successfully`)
      return true
    } catch (error) {
      this.logIssue('high', `Failed to load ${pageName}: ${error.message}`)
      return false
    }
  }

  async testLoginSystem() {
    console.log('\\n🔐 Testing 10-Button Login System...')
    
    const loginLoaded = await this.testPage(`${this.baseUrl}/auth/login`, 'Login Page')
    if (!loginLoaded) return
    
    try {
      // Test each login button
      for (let i = 1; i <= 10; i++) {
        const buttonSelector = `button:has-text("User ${i}")`
        const button = await this.page.locator(buttonSelector).first()
        
        if (await button.count() > 0) {
          this.logSuccess(`Found login button for User ${i}`)
          
          // Test click (but don't actually login to avoid session issues)
          const isEnabled = await button.isEnabled()
          if (isEnabled) {
            this.logSuccess(`User ${i} button is clickable`)
          } else {
            this.logIssue('medium', `User ${i} button is disabled`)
          }
        } else {
          this.logIssue('high', `Login button for User ${i} not found`)
        }
      }
      
      // Test one actual login
      const testButton = this.page.locator('button:has-text("User 1")').first()
      if (await testButton.count() > 0) {
        await testButton.click()
        await this.page.waitForTimeout(2000)
        
        // Check if redirected to dashboard
        const currentUrl = this.page.url()
        if (currentUrl.includes('/dashboard') || !currentUrl.includes('/auth/login')) {
          this.logSuccess('Login redirect works correctly')
        } else {
          this.logIssue('high', 'Login did not redirect properly')
        }
      }
      
    } catch (error) {
      this.logIssue('high', `Login testing failed: ${error.message}`)
    }
  }

  async testSportsDataIntegration() {
    console.log('\\n🏈 Testing SportsDataIO Integration...')
    
    const adminLoaded = await this.testPage(`${this.baseUrl}/admin/setup`, 'Admin Setup')
    if (!adminLoaded) return
    
    try {
      // Test API Status button
      const statusButton = this.page.locator('button:has-text("Check API Status")')
      if (await statusButton.count() > 0) {
        await statusButton.click()
        await this.page.waitForTimeout(3000)
        
        // Check if status appears
        const statusDisplay = await this.page.locator('.bg-gray-800').count()
        if (statusDisplay > 0) {
          this.logSuccess('API status check works')
        } else {
          this.logIssue('medium', 'API status not displayed after click')
        }
      }
      
      // Test team dropdown
      const teamDropdown = this.page.locator('select')
      if (await teamDropdown.count() > 0) {
        await teamDropdown.selectOption('KC')
        this.logSuccess('Team dropdown works')
      } else {
        this.logIssue('medium', 'Team dropdown not found')
      }
      
      // Note: Don't actually run sync operations as they're expensive
      const syncButton = this.page.locator('button:has-text("Sync All Players")')
      if (await syncButton.count() > 0) {
        this.logSuccess('Sync buttons are present')
      } else {
        this.logIssue('medium', 'Sync buttons not found')
      }
      
    } catch (error) {
      this.logIssue('high', `SportsData integration testing failed: ${error.message}`)
    }
  }

  async testNavigation() {
    console.log('\\n🧭 Testing Navigation...')
    
    const routes = [
      { path: '/', name: 'Homepage' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/players', name: 'Players' },
      { path: '/leagues/create', name: 'Create League' },
      { path: '/status', name: 'Status Page' }
    ]
    
    for (const route of routes) {
      await this.testPage(`${this.baseUrl}${route.path}`, route.name)
      await this.page.waitForTimeout(1000)
    }
  }

  async testInteractiveElements() {
    console.log('\\n🖱️ Testing Interactive Elements...')
    
    // Go to homepage
    await this.page.goto(this.baseUrl)
    
    try {
      // Test all links
      const links = await this.page.locator('a').count()
      console.log(`Found ${links} links to test`)
      
      // Test buttons
      const buttons = await this.page.locator('button').count()
      console.log(`Found ${buttons} buttons to test`)
      
      // Test forms
      const forms = await this.page.locator('form').count()
      console.log(`Found ${forms} forms to test`)
      
      this.logSuccess(`Interactive elements discovered: ${links} links, ${buttons} buttons, ${forms} forms`)
      
    } catch (error) {
      this.logIssue('medium', `Interactive elements testing failed: ${error.message}`)
    }
  }

  async testResponsiveDesign() {
    console.log('\\n📱 Testing Responsive Design...')
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ]
    
    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`)
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height })
      await this.page.goto(this.baseUrl)
      await this.page.waitForTimeout(2000)
      
      // Take screenshot
      await this.page.screenshot({ 
        path: `tests/screenshots/${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      })
      
      this.logSuccess(`${viewport.name} layout captured`)
    }
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 })
  }

  async testApiEndpoints() {
    console.log('\\n🔌 Testing API Endpoints...')
    
    const endpoints = [
      { url: '/api/health', method: 'GET' },
      { url: '/api/sync-sportsdata', method: 'GET' }
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.page.request.get(`${this.baseUrl}${endpoint.url}`)
        
        if (response.ok()) {
          this.logSuccess(`API ${endpoint.url} responds correctly (${response.status()})`)
        } else {
          this.logIssue('medium', `API ${endpoint.url} returned ${response.status()}`)
        }
      } catch (error) {
        this.logIssue('high', `API ${endpoint.url} failed: ${error.message}`)
      }
    }
  }

  async testAccessibility() {
    console.log('\\n♿ Testing Basic Accessibility...')
    
    await this.page.goto(this.baseUrl)
    
    try {
      // Test keyboard navigation
      await this.page.keyboard.press('Tab')
      await this.page.waitForTimeout(500)
      
      const focusedElement = await this.page.locator(':focus').count()
      if (focusedElement > 0) {
        this.logSuccess('Keyboard navigation works')
      } else {
        this.logIssue('medium', 'No focus indicator on tab navigation')
      }
      
      // Test for alt text on images
      const imagesWithoutAlt = await this.page.locator('img:not([alt])').count()
      if (imagesWithoutAlt === 0) {
        this.logSuccess('All images have alt text')
      } else {
        this.logIssue('medium', `${imagesWithoutAlt} images missing alt text`)
      }
      
    } catch (error) {
      this.logIssue('medium', `Accessibility testing failed: ${error.message}`)
    }
  }

  printResults() {
    console.log('\\n' + '='.repeat(60))
    console.log('🏁 TESTING COMPLETE')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${this.testResults.passed}`)
    console.log(`❌ Failed: ${this.testResults.issues.length}`)
    
    if (this.testResults.issues.length > 0) {
      console.log('\\n🐛 ISSUES FOUND:')
      console.log('-'.repeat(40))
      
      const highPriority = this.testResults.issues.filter(i => i.severity === 'high')
      const mediumPriority = this.testResults.issues.filter(i => i.severity === 'medium')
      const lowPriority = this.testResults.issues.filter(i => i.severity === 'low')
      
      if (highPriority.length > 0) {
        console.log('\\n🔴 HIGH PRIORITY:')
        highPriority.forEach(issue => console.log(`  • ${issue.message}`))
      }
      
      if (mediumPriority.length > 0) {
        console.log('\\n🟡 MEDIUM PRIORITY:')
        mediumPriority.forEach(issue => console.log(`  • ${issue.message}`))
      }
      
      if (lowPriority.length > 0) {
        console.log('\\n🟢 LOW PRIORITY:')
        lowPriority.forEach(issue => console.log(`  • ${issue.message}`))
      }
    }
    
    console.log('\\n📊 TEST SUMMARY:')
    console.log(`Total Issues: ${this.testResults.issues.length}`)
    console.log(`Success Rate: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.issues.length)) * 100)}%`)
  }

  async runAllTests() {
    try {
      await this.setup()
      
      // Run test suites
      await this.testNavigation()
      await this.testLoginSystem() 
      await this.testSportsDataIntegration()
      await this.testInteractiveElements()
      await this.testResponsiveDesign()
      await this.testApiEndpoints()
      await this.testAccessibility()
      
    } catch (error) {
      console.error('❌ Testing failed:', error)
    } finally {
      await this.teardown()
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AstralFieldTester()
  tester.runAllTests().catch(console.error)
}

module.exports = AstralFieldTester