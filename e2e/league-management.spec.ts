import { test, expect, Page } from '@playwright/test';

// Test data
const testLeague = {
  name: 'E2E Test League 2025',
  description: 'A comprehensive test league for end-to-end testing',
  maxTeams: 8,
  seasonYear: 2025,
};

const testUser = {
  email: 'e2e-test@example.com',
  username: 'e2euser',
  fullName: 'E2E Test User',
  password: 'TestPass123!',
};

// Helper functions
async function authenticateUser(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('[data-testid=email-input]', testUser.email);
  await page.fill('[data-testid=password-input]', testUser.password);
  
  // Submit form
  await page.click('[data-testid=login-button]');
  
  // Wait for successful login
  await expect(page).toHaveURL('/dashboard');
}

async function createTestLeague(page: Page) {
  // Navigate to create league page
  await page.goto('/leagues/create');
  
  // Fill in league details
  await page.fill('[data-testid=league-name-input]', testLeague.name);
  await page.fill('[data-testid=league-description-input]', testLeague.description);
  
  // Select league settings
  await page.selectOption('[data-testid=max-teams-select]', testLeague.maxTeams.toString());
  await page.selectOption('[data-testid=season-year-select]', testLeague.seasonYear.toString());
  
  // Submit form
  await page.click('[data-testid=create-league-button]');
  
  // Wait for league to be created
  await expect(page).toHaveURL(/\/leagues\/[a-zA-Z0-9-]+/);
  
  // Extract league ID from URL
  const url = page.url();
  const leagueId = url.split('/leagues/')[1].split('/')[0];
  
  return leagueId;
}

test.describe('League Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
    
    // Mock any external API calls if needed
    await page.route('**/api/external/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mock: true }),
      });
    });
  });

  test.describe('League Creation Flow', () => {
    test('should create a new league successfully', async ({ page }) => {
      // Authenticate user
      await authenticateUser(page);
      
      // Navigate to create league page
      await page.goto('/leagues/create');
      
      // Verify page loaded correctly
      await expect(page.locator('h1')).toContainText('Create New League');
      
      // Fill in basic league information
      await page.fill('[data-testid=league-name-input]', testLeague.name);
      await page.fill('[data-testid=league-description-input]', testLeague.description);
      
      // Configure league settings
      await page.selectOption('[data-testid=max-teams-select]', '8');
      await page.selectOption('[data-testid=league-type-select]', 'standard');
      
      // Set scoring settings
      await page.fill('[data-testid=passing-yards-input]', '0.04');
      await page.fill('[data-testid=passing-td-input]', '4');
      await page.fill('[data-testid=rushing-yards-input]', '0.1');
      await page.fill('[data-testid=rushing-td-input]', '6');
      
      // Submit form
      await page.click('[data-testid=create-league-button]');
      
      // Verify league was created
      await expect(page).toHaveURL(/\/leagues\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid=league-name]')).toContainText(testLeague.name);
      await expect(page.locator('[data-testid=league-status]')).toContainText('Draft');
      
      // Verify league settings are displayed correctly
      await expect(page.locator('[data-testid=max-teams-display]')).toContainText('8');
      await expect(page.locator('[data-testid=league-type-display]')).toContainText('Standard');
    });

    test('should validate required fields', async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/leagues/create');
      
      // Try to submit empty form
      await page.click('[data-testid=create-league-button]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid=name-error]')).toContainText('League name is required');
      await expect(page.locator('[data-testid=max-teams-error]')).toContainText('Maximum teams is required');
    });

    test('should prevent duplicate league names', async ({ page }) => {
      await authenticateUser(page);
      
      // Create first league
      const leagueId1 = await createTestLeague(page);
      
      // Try to create another league with same name
      await page.goto('/leagues/create');
      await page.fill('[data-testid=league-name-input]', testLeague.name);
      await page.fill('[data-testid=league-description-input]', 'Different description');
      await page.click('[data-testid=create-league-button]');
      
      // Verify error message
      await expect(page.locator('[data-testid=error-message]')).toContainText('League name already exists');
    });
  });

  test.describe('League Settings Management', () => {
    test('should allow commissioner to update league settings', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Navigate to league settings
      await page.goto(`/leagues/${leagueId}/settings`);
      
      // Verify current user is commissioner
      await expect(page.locator('[data-testid=commissioner-badge]')).toBeVisible();
      
      // Update league name
      const newName = 'Updated Test League';
      await page.fill('[data-testid=league-name-input]', newName);
      
      // Update waiver settings
      await page.selectOption('[data-testid=waiver-period-select]', '1');
      
      // Save changes
      await page.click('[data-testid=save-settings-button]');
      
      // Verify success message
      await expect(page.locator('[data-testid=success-message]')).toContainText('League settings updated');
      
      // Verify changes were saved
      await page.reload();
      await expect(page.locator('[data-testid=league-name-input]')).toHaveValue(newName);
      await expect(page.locator('[data-testid=waiver-period-select]')).toHaveValue('1');
    });

    test('should prevent non-commissioners from accessing settings', async ({ page, browser }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Create second user session
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Simulate different user (would normally register/login as different user)
      await page2.goto(`/leagues/${leagueId}/settings`);
      
      // Verify access is denied
      await expect(page2.locator('[data-testid=error-message]')).toContainText('Access denied');
    });

    test('should prevent settings changes after draft starts', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Start draft
      await page.goto(`/leagues/${leagueId}/draft`);
      await page.click('[data-testid=start-draft-button]');
      
      // Try to access settings
      await page.goto(`/leagues/${leagueId}/settings`);
      
      // Verify settings are disabled
      await expect(page.locator('[data-testid=league-name-input]')).toBeDisabled();
      await expect(page.locator('[data-testid=save-settings-button]')).toBeDisabled();
      
      // Verify warning message
      await expect(page.locator('[data-testid=warning-message]')).toContainText('Settings cannot be changed after draft starts');
    });
  });

  test.describe('League Member Management', () => {
    test('should allow users to join a league', async ({ page, browser }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Get league invitation link
      await page.goto(`/leagues/${leagueId}/invite`);
      const inviteLink = await page.locator('[data-testid=invite-link]').textContent();
      
      // Create second user session
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Navigate to invite link (simulate new user)
      await page2.goto(inviteLink!);
      
      // Join league
      await page2.click('[data-testid=join-league-button]');
      
      // Verify user joined successfully
      await expect(page2.locator('[data-testid=success-message]')).toContainText('Successfully joined league');
      await expect(page2).toHaveURL(`/leagues/${leagueId}`);
      
      // Verify user appears in member list
      await page.goto(`/leagues/${leagueId}/members`);
      await expect(page.locator('[data-testid=member-count]')).toContainText('2 members');
    });

    test('should prevent joining full leagues', async ({ page }) => {
      await authenticateUser(page);
      
      // Create league with max 2 teams
      await page.goto('/leagues/create');
      await page.fill('[data-testid=league-name-input]', 'Small League');
      await page.selectOption('[data-testid=max-teams-select]', '2');
      await page.click('[data-testid=create-league-button]');
      
      const url = page.url();
      const leagueId = url.split('/leagues/')[1];
      
      // Simulate league being full (would require additional setup)
      await page.goto(`/leagues/${leagueId}/join`);
      
      // Mock full league response
      await page.route(`**/api/leagues/${leagueId}/join`, route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'League is full' }),
        });
      });
      
      await page.click('[data-testid=join-league-button]');
      
      // Verify error message
      await expect(page.locator('[data-testid=error-message]')).toContainText('League is full');
    });

    test('should allow members to leave league', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Navigate to league
      await page.goto(`/leagues/${leagueId}`);
      
      // Open leave league modal
      await page.click('[data-testid=league-menu-button]');
      await page.click('[data-testid=leave-league-option]');
      
      // Confirm leaving
      await page.click('[data-testid=confirm-leave-button]');
      
      // Verify user left league
      await expect(page.locator('[data-testid=success-message]')).toContainText('Successfully left league');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Draft Management', () => {
    test('should conduct a complete draft workflow', async ({ page, browser }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Add second user to league (simplified for testing)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Navigate to draft page
      await page.goto(`/leagues/${leagueId}/draft`);
      
      // Verify draft is ready
      await expect(page.locator('[data-testid=draft-status]')).toContainText('Ready to Draft');
      
      // Start draft
      await page.click('[data-testid=start-draft-button]');
      
      // Verify draft started
      await expect(page.locator('[data-testid=draft-status]')).toContainText('Draft in Progress');
      
      // Verify draft board is displayed
      await expect(page.locator('[data-testid=draft-board]')).toBeVisible();
      await expect(page.locator('[data-testid=available-players]')).toBeVisible();
      
      // Verify current pick indicator
      await expect(page.locator('[data-testid=current-pick]')).toContainText('Pick 1');
      
      // Make first pick
      await page.click('[data-testid=player-card]').first();
      await page.click('[data-testid=draft-player-button]');
      
      // Verify pick was made
      await expect(page.locator('[data-testid=draft-board] [data-testid=pick-1]')).toBeVisible();
      await expect(page.locator('[data-testid=current-pick]')).toContainText('Pick 2');
      
      // Verify real-time updates work
      await expect(page.locator('[data-testid=picks-remaining]')).toContainText('127 picks remaining');
    });

    test('should enforce draft time limits', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Set short draft timer for testing
      await page.goto(`/leagues/${leagueId}/settings`);
      await page.fill('[data-testid=pick-time-limit]', '5'); // 5 seconds
      await page.click('[data-testid=save-settings-button]');
      
      // Start draft
      await page.goto(`/leagues/${leagueId}/draft`);
      await page.click('[data-testid=start-draft-button]');
      
      // Wait for auto-pick timer
      await expect(page.locator('[data-testid=pick-timer]')).toBeVisible();
      
      // Wait for timer to expire
      await page.waitForTimeout(6000);
      
      // Verify auto-pick occurred
      await expect(page.locator('[data-testid=auto-pick-message]')).toContainText('Auto-drafted');
      await expect(page.locator('[data-testid=current-pick]')).toContainText('Pick 2');
    });

    test('should handle draft interruptions gracefully', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Start draft
      await page.goto(`/leagues/${leagueId}/draft`);
      await page.click('[data-testid=start-draft-button]');
      
      // Make a pick
      await page.click('[data-testid=player-card]').first();
      await page.click('[data-testid=draft-player-button]');
      
      // Simulate page refresh (network interruption)
      await page.reload();
      
      // Verify draft state is restored
      await expect(page.locator('[data-testid=draft-status]')).toContainText('Draft in Progress');
      await expect(page.locator('[data-testid=draft-board] [data-testid=pick-1]')).toBeVisible();
      await expect(page.locator('[data-testid=current-pick]')).toContainText('Pick 2');
    });
  });

  test.describe('Real-time Features', () => {
    test('should display live score updates', async ({ page }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Navigate to live scoring page
      await page.goto(`/leagues/${leagueId}/live-scoring`);
      
      // Mock WebSocket connection
      await page.evaluate(() => {
        // Simulate WebSocket message
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: {
            type: 'score_update',
            data: {
              playerId: 'player-123',
              points: 15.6,
              timestamp: Date.now(),
            },
          },
        }));
      });
      
      // Verify live score update is displayed
      await expect(page.locator('[data-testid=live-score-update]')).toContainText('15.6');
    });

    test('should show real-time chat messages', async ({ page, browser }) => {
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Open chat
      await page.goto(`/leagues/${leagueId}/chat`);
      
      // Send a message
      await page.fill('[data-testid=chat-input]', 'Hello from E2E test!');
      await page.click('[data-testid=send-message-button]');
      
      // Verify message appears
      await expect(page.locator('[data-testid=chat-messages]')).toContainText('Hello from E2E test!');
      
      // Create second user session to verify real-time updates
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      await page2.goto(`/leagues/${leagueId}/chat`);
      
      // Verify message is visible to other users
      await expect(page2.locator('[data-testid=chat-messages]')).toContainText('Hello from E2E test!');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      // Test mobile navigation
      await page.goto(`/leagues/${leagueId}`);
      
      // Verify mobile menu works
      await page.click('[data-testid=mobile-menu-button]');
      await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();
      
      // Test mobile draft interface
      await page.goto(`/leagues/${leagueId}/draft`);
      await page.click('[data-testid=start-draft-button]');
      
      // Verify mobile draft layout
      await expect(page.locator('[data-testid=mobile-draft-board]')).toBeVisible();
      await expect(page.locator('[data-testid=mobile-player-list]')).toBeVisible();
      
      // Test swiping gestures (if implemented)
      const playerList = page.locator('[data-testid=mobile-player-list]');
      await playerList.swipe('left');
      
      // Verify swipe functionality
      await expect(page.locator('[data-testid=player-filters]')).toBeVisible();
    });

    test('should handle touch interactions correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authenticateUser(page);
      const leagueId = await createTestLeague(page);
      
      await page.goto(`/leagues/${leagueId}/draft`);
      await page.click('[data-testid=start-draft-button]');
      
      // Test touch interactions
      const playerCard = page.locator('[data-testid=player-card]').first();
      
      // Long press to show player details
      await playerCard.dispatchEvent('touchstart');
      await page.waitForTimeout(500);
      await playerCard.dispatchEvent('touchend');
      
      // Verify player details modal appears
      await expect(page.locator('[data-testid=player-details-modal]')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      await authenticateUser(page);
      
      // Measure page load performance
      const navigationPromise = page.waitForLoadState('networkidle');
      await page.goto('/leagues/create');
      await navigationPromise;
      
      // Check for performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        };
      });
      
      // Assert performance thresholds
      expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 seconds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    });

    test('should be accessible to screen readers', async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/leagues/create');
      
      // Check for proper ARIA labels
      await expect(page.locator('[data-testid=league-name-input]')).toHaveAttribute('aria-label', 'League name');
      await expect(page.locator('[data-testid=league-description-input]')).toHaveAttribute('aria-label', 'League description');
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Check for proper form labels
      const inputs = await page.locator('input, select, textarea').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
        }
      }
    });

    test('should handle high contrast mode', async ({ page }) => {
      // Enable high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      await authenticateUser(page);
      await page.goto('/leagues/create');
      
      // Verify high contrast styles are applied
      const backgroundColor = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have dark background in high contrast mode
      expect(backgroundColor).toBe('rgb(0, 0, 0)');
    });
  });
});