/**
 * Visual Regression Tests
 * Automated UI testing for visual consistency and cross-browser compatibility
 */

import { test, expect, devices, Page } from '@playwright/test';

// Test configuration
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  desktop_xl: { width: 1920, height: 1080 }
};

const BROWSERS = ['chromium', 'firefox', 'webkit'];

// Test data
const testUser = {
  email: 'visual-test@example.com',
  username: 'visualtest',
  password: 'VisualTest123!',
  firstName: 'Visual',
  lastName: 'Test'
};

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
  });

  test.describe('Landing Page', () => {
    Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
      test(`Landing page - ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Wait for any animations to complete
        await page.waitForTimeout(1000);
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot(`landing-page-${device}.png`, {
          fullPage: true,
          animations: 'disabled'
        });

        // Test specific sections
        await expect(page.locator('.hero-section')).toHaveScreenshot(`hero-section-${device}.png`);
        await expect(page.locator('.features-section')).toHaveScreenshot(`features-section-${device}.png`);
      });
    });

    test('Landing page - dark mode', async ({ page }) => {
      await page.goto('/');
      
      // Toggle dark mode
      await page.getByTestId('theme-toggle').click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      await expect(page).toHaveScreenshot('landing-page-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Landing page - high contrast mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable high contrast mode
      await page.addInitScript(() => {
        window.matchMedia = (query) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        });
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-page-high-contrast.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Authentication Pages', () => {
    test('Signup page visual consistency', async ({ page }) => {
      await page.goto('/auth/signup');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true,
        animations: 'disabled'
      });

      // Test form states
      await page.getByTestId('email-input').fill('invalid-email');
      await page.getByTestId('submit-signup-button').click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('signup-page-validation-errors.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Login page visual consistency', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-page.png');

      // Test error state
      await page.getByTestId('email-input').fill('test@example.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('submit-login-button').click();
      
      // Wait for error message
      await page.waitForSelector('[data-testid="login-error"]', { timeout: 5000 });
      
      await expect(page).toHaveScreenshot('login-page-error-state.png');
    });

    test('Password reset flow visuals', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('forgot-password-page.png');

      // Fill form and submit
      await page.getByTestId('email-input').fill('test@example.com');
      await page.getByTestId('submit-button').click();
      
      // Wait for success state
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      await expect(page).toHaveScreenshot('forgot-password-success.png');
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Create user and login
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
      test(`Dashboard overview - ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        await expect(page).toHaveScreenshot(`dashboard-overview-${device}.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    });

    test('Dashboard empty state', async ({ page }) => {
      // Should show empty state for new user
      await expect(page.locator('.empty-leagues-state')).toHaveScreenshot('empty-leagues-state.png');
    });

    test('Dashboard navigation', async ({ page }) => {
      // Test different tabs
      await page.getByTestId('my-leagues-tab').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.leagues-section')).toHaveScreenshot('dashboard-leagues-tab.png');

      await page.getByTestId('my-teams-tab').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.teams-section')).toHaveScreenshot('dashboard-teams-tab.png');

      await page.getByTestId('activity-tab').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.activity-section')).toHaveScreenshot('dashboard-activity-tab.png');
    });

    test('Mobile dashboard navigation', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      
      // Test mobile menu
      await page.getByTestId('mobile-menu-button').click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('.mobile-menu')).toHaveScreenshot('mobile-menu-open.png');
    });
  });

  test.describe('League Management', () => {
    test.beforeEach(async ({ page }) => {
      // Setup authenticated user
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();
      await page.waitForURL('/dashboard');
    });

    test('League creation form', async ({ page }) => {
      await page.getByTestId('create-league-button').click();
      await page.waitForURL('/leagues/create');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('league-creation-form.png', {
        fullPage: true,
        animations: 'disabled'
      });

      // Test form sections
      await expect(page.locator('.basic-info-section')).toHaveScreenshot('league-basic-info-section.png');
      await expect(page.locator('.settings-section')).toHaveScreenshot('league-settings-section.png');
      await expect(page.locator('.roster-settings-section')).toHaveScreenshot('league-roster-settings.png');
    });

    test('League creation form validation', async ({ page }) => {
      await page.getByTestId('create-league-button').click();
      await page.waitForURL('/leagues/create');
      
      // Submit form with empty fields
      await page.getByTestId('create-league-submit-button').click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('league-creation-validation-errors.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('League settings interface', async ({ page }) => {
      // Create a league first
      await page.getByTestId('create-league-button').click();
      await page.getByTestId('league-name-input').fill('Visual Test League');
      await page.getByTestId('create-league-submit-button').click();
      
      // Wait for league page
      await page.waitForURL(/\/leagues\/[a-z0-9-]+$/);
      await page.waitForLoadState('networkidle');
      
      // Navigate to settings
      await page.getByTestId('league-settings-tab').click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('league-settings-page.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('League member management', async ({ page }) => {
      // Create a league
      await page.getByTestId('create-league-button').click();
      await page.getByTestId('league-name-input').fill('Member Test League');
      await page.getByTestId('create-league-submit-button').click();
      await page.waitForURL(/\/leagues\/[a-z0-9-]+$/);
      
      // Navigate to members tab
      await page.getByTestId('league-members-tab').click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('league-members-page.png', {
        fullPage: true,
        animations: 'disabled'
      });

      // Test invite modal
      await page.getByTestId('invite-members-button').click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('.invite-modal')).toHaveScreenshot('invite-members-modal.png');
    });
  });

  test.describe('Draft Interface', () => {
    test('Draft board layout', async ({ page }) => {
      // Mock draft data
      await page.route('**/api/draft/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            draftId: 'test-draft',
            status: 'active',
            currentPick: 1,
            players: Array.from({ length: 50 }, (_, i) => ({
              id: `player-${i}`,
              name: `Player ${i + 1}`,
              position: ['QB', 'RB', 'WR', 'TE'][i % 4],
              team: 'TEST',
              adp: i + 1
            })),
            teams: Array.from({ length: 10 }, (_, i) => ({
              id: `team-${i}`,
              name: `Team ${i + 1}`,
              roster: []
            }))
          })
        });
      });

      await page.goto('/draft/test-draft');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('draft-board-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });

      // Test mobile draft interface
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('draft-board-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Draft pick interface', async ({ page }) => {
      await page.route('**/api/draft/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            draftId: 'test-draft',
            status: 'active',
            currentPick: 1,
            isUserTurn: true,
            timeRemaining: 90,
            availablePlayers: Array.from({ length: 20 }, (_, i) => ({
              id: `player-${i}`,
              name: `Available Player ${i + 1}`,
              position: ['QB', 'RB', 'WR', 'TE'][i % 4],
              team: 'TEST'
            }))
          })
        });
      });

      await page.goto('/draft/test-draft');
      await page.waitForLoadState('networkidle');
      
      // Should show user's turn interface
      await expect(page.locator('.draft-pick-interface')).toHaveScreenshot('draft-pick-interface.png');

      // Test player selection
      await page.getByTestId('player-0').click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('.player-selected')).toHaveScreenshot('player-selected-state.png');
    });
  });

  test.describe('Responsive Design', () => {
    const testPages = [
      { path: '/', name: 'landing' },
      { path: '/auth/signup', name: 'signup' },
      { path: '/auth/login', name: 'login' },
      { path: '/dashboard', name: 'dashboard', requireAuth: true }
    ];

    testPages.forEach(({ path, name, requireAuth }) => {
      Object.entries(VIEWPORTS).forEach(([device, viewport]) => {
        test(`${name} page responsive - ${device}`, async ({ page }) => {
          if (requireAuth) {
            // Quick auth setup
            await page.goto('/auth/signup');
            await page.getByTestId('email-input').fill(`${device}-${testUser.email}`);
            await page.getByTestId('username-input').fill(`${device}-${testUser.username}`);
            await page.getByTestId('password-input').fill(testUser.password);
            await page.getByTestId('confirm-password-input').fill(testUser.password);
            await page.getByTestId('first-name-input').fill(testUser.firstName);
            await page.getByTestId('last-name-input').fill(testUser.lastName);
            await page.getByTestId('terms-checkbox').check();
            await page.getByTestId('submit-signup-button').click();
            await page.waitForURL('/dashboard');
          }

          await page.setViewportSize(viewport);
          await page.goto(path);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          await expect(page).toHaveScreenshot(`${name}-responsive-${device}.png`, {
            fullPage: true,
            animations: 'disabled'
          });
        });
      });
    });
  });

  test.describe('Component Visual Tests', () => {
    test('Button components', async ({ page }) => {
      // Create a test page with all button variants
      await page.setContent(`
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 10px;">
          <button class="btn btn-primary">Primary Button</button>
          <button class="btn btn-secondary">Secondary Button</button>
          <button class="btn btn-success">Success Button</button>
          <button class="btn btn-danger">Danger Button</button>
          <button class="btn btn-outline-primary">Outline Primary</button>
          <button class="btn btn-primary" disabled>Disabled Button</button>
          <button class="btn btn-primary btn-loading">Loading Button</button>
        </div>
      `);

      await expect(page.locator('div').first()).toHaveScreenshot('button-components.png');
    });

    test('Form components', async ({ page }) => {
      await page.setContent(`
        <div style="padding: 20px; max-width: 400px;">
          <div style="margin-bottom: 15px;">
            <label>Text Input</label>
            <input type="text" class="form-input" placeholder="Enter text">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Text Input (Error)</label>
            <input type="text" class="form-input error" value="Invalid value">
            <span class="error-message">This field is required</span>
          </div>
          <div style="margin-bottom: 15px;">
            <label>Select</label>
            <select class="form-select">
              <option>Choose option...</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label>Checkbox</label>
            <input type="checkbox" class="form-checkbox"> Check me
          </div>
          <div style="margin-bottom: 15px;">
            <label>Radio Buttons</label>
            <input type="radio" name="test" class="form-radio"> Option A
            <input type="radio" name="test" class="form-radio"> Option B
          </div>
        </div>
      `);

      await expect(page.locator('div').first()).toHaveScreenshot('form-components.png');
    });

    test('Card components', async ({ page }) => {
      await page.setContent(`
        <div style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div class="card">
            <div class="card-header">
              <h3>League Name</h3>
              <span class="badge">Active</span>
            </div>
            <div class="card-body">
              <p>League description and details</p>
              <div class="card-stats">
                <span>10/12 Teams</span>
                <span>Week 8</span>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-sm">View League</button>
            </div>
          </div>
          
          <div class="card card-highlight">
            <div class="card-header">
              <h3>My Team</h3>
              <span class="badge badge-success">1st Place</span>
            </div>
            <div class="card-body">
              <p>Team performance overview</p>
              <div class="card-stats">
                <span>8-1-0</span>
                <span>1,234 PF</span>
              </div>
            </div>
          </div>
        </div>
      `);

      await expect(page.locator('div').first()).toHaveScreenshot('card-components.png');
    });
  });

  test.describe('Dark Mode Consistency', () => {
    test.beforeEach(async ({ page }) => {
      // Enable dark mode
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark');
      });
    });

    test('Dark mode landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('landing-page-dark.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Dark mode dashboard', async ({ page }) => {
      // Quick auth and navigate to dashboard
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill('dark-' + testUser.email);
      await page.getByTestId('username-input').fill('dark-' + testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();
      
      await page.waitForURL('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('dashboard-dark.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Dark mode forms', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('login-form-dark.png');
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    // Note: These would run on different browsers in CI
    test('Cross-browser landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const browserName = page.context().browser()?.browserType().name() || 'unknown';
      
      await expect(page).toHaveScreenshot(`landing-page-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3 // Allow slight rendering differences between browsers
      });
    });
  });

  test.describe('Accessibility Visual Tests', () => {
    test('High contrast mode', async ({ page }) => {
      await page.emulateMedia({ 
        colorScheme: 'dark',
        reducedMotion: 'reduce'
      });
      
      await page.addInitScript(() => {
        // Simulate high contrast mode
        document.documentElement.style.setProperty('--contrast-ratio', 'high');
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-page-high-contrast.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('Reduced motion mode', async ({ page }) => {
      await page.emulateMedia({ 
        reducedMotion: 'reduce'
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Allow any animations to complete
      
      await expect(page).toHaveScreenshot('landing-page-reduced-motion.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });
});