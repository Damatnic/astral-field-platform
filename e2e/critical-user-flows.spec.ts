/**
 * Critical User Flows E2E Tests
 * Tests complete user journeys from signup to league management and drafting
 */

import { test, expect, Page } from '@playwright/test';

// Test data and utilities
const generateTestEmail = () => `test-${Date.now()}@example.com`;
const generateTestUsername = () => `testuser${Date.now()}`;
const generateLeagueName = () => `Test League ${Date.now()}`;

test.describe('Critical User Flows', () => {
  let page: Page;
  let testUser: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Generate unique test user data
    testUser = {
      email: generateTestEmail(),
      username: generateTestUsername(),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    // Start each test from the home page
    await page.goto('/');
  });

  test.describe('User Authentication Flow', () => {
    test('should complete full signup and login flow', async () => {
      // 1. Navigate to signup page
      await page.getByTestId('signup-button').click();
      await expect(page).toHaveURL('/auth/signup');

      // 2. Fill out signup form
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);

      // Accept terms and conditions
      await page.getByTestId('terms-checkbox').check();

      // 3. Submit signup form
      await page.getByTestId('submit-signup-button').click();

      // 4. Verify successful signup (redirected to dashboard)
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByTestId('welcome-message')).toContainText(testUser.firstName);

      // 5. Logout
      await page.getByTestId('user-menu-button').click();
      await page.getByTestId('logout-button').click();
      await expect(page).toHaveURL('/');

      // 6. Login with created credentials
      await page.getByTestId('login-button').click();
      await expect(page).toHaveURL('/auth/login');

      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('submit-login-button').click();

      // 7. Verify successful login
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByTestId('user-profile-name')).toContainText(testUser.firstName);
    });

    test('should handle login errors gracefully', async () => {
      // Navigate to login page
      await page.getByTestId('login-button').click();

      // Try invalid credentials
      await page.getByTestId('email-input').fill('invalid@example.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('submit-login-button').click();

      // Verify error message is displayed
      await expect(page.getByTestId('login-error')).toBeVisible();
      await expect(page.getByTestId('login-error')).toContainText('Invalid credentials');
    });

    test('should validate form inputs during signup', async () => {
      await page.getByTestId('signup-button').click();

      // Test empty form submission
      await page.getByTestId('submit-signup-button').click();
      
      await expect(page.getByTestId('email-error')).toBeVisible();
      await expect(page.getByTestId('password-error')).toBeVisible();

      // Test invalid email format
      await page.getByTestId('email-input').fill('invalid-email');
      await page.getByTestId('submit-signup-button').click();
      await expect(page.getByTestId('email-error')).toContainText('valid email');

      // Test weak password
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('password-input').fill('weak');
      await page.getByTestId('submit-signup-button').click();
      await expect(page.getByTestId('password-error')).toContainText('password must');

      // Test password mismatch
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill('different-password');
      await page.getByTestId('submit-signup-button').click();
      await expect(page.getByTestId('confirm-password-error')).toContainText('match');
    });
  });

  test.describe('League Creation and Management Flow', () => {
    test.beforeEach(async () => {
      // Create and login user before each league test
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should create and configure a fantasy league', async () => {
      const leagueName = generateLeagueName();

      // 1. Navigate to create league
      await page.getByTestId('create-league-button').click();
      await expect(page).toHaveURL('/leagues/create');

      // 2. Fill out basic league information
      await page.getByTestId('league-name-input').fill(leagueName);
      await page.getByTestId('league-description-input').fill('Test league for E2E testing');
      await page.getByTestId('max-teams-select').selectOption('10');
      await page.getByTestId('season-year-select').selectOption('2025');

      // 3. Configure league settings
      await page.getByTestId('scoring-type-select').selectOption('ppr');
      await page.getByTestId('draft-type-select').selectOption('snake');
      
      // Configure roster settings
      await page.getByTestId('qb-positions-input').fill('1');
      await page.getByTestId('rb-positions-input').fill('2');
      await page.getByTestId('wr-positions-input').fill('2');
      await page.getByTestId('te-positions-input').fill('1');
      await page.getByTestId('flex-positions-input').fill('1');
      await page.getByTestId('k-positions-input').fill('1');
      await page.getByTestId('def-positions-input').fill('1');
      await page.getByTestId('bench-positions-input').fill('7');

      // 4. Set advanced settings
      await page.getByTestId('waiver-type-select').selectOption('faab');
      await page.getByTestId('faab-budget-input').fill('100');
      await page.getByTestId('trade-deadline-input').fill('2025-11-15');
      await page.getByTestId('playoff-teams-select').selectOption('4');

      // 5. Create the league
      await page.getByTestId('create-league-submit-button').click();

      // 6. Verify league creation success
      await expect(page).toHaveURL(/\/leagues\/[a-z0-9-]+$/);
      await expect(page.getByTestId('league-name')).toContainText(leagueName);
      await expect(page.getByTestId('commissioner-badge')).toBeVisible();
      await expect(page.getByTestId('league-status')).toContainText('Forming');

      // 7. Verify league settings are correctly saved
      await page.getByTestId('league-settings-tab').click();
      await expect(page.getByTestId('scoring-type-display')).toContainText('PPR');
      await expect(page.getByTestId('draft-type-display')).toContainText('Snake');
      await expect(page.getByTestId('max-teams-display')).toContainText('10');
      await expect(page.getByTestId('waiver-type-display')).toContainText('FAAB');
    });

    test('should allow league settings modification before draft', async () => {
      // Create a league first
      await page.getByTestId('create-league-button').click();
      const leagueName = generateLeagueName();
      
      await page.getByTestId('league-name-input').fill(leagueName);
      await page.getByTestId('max-teams-select').selectOption('8');
      await page.getByTestId('season-year-select').selectOption('2025');
      await page.getByTestId('create-league-submit-button').click();

      // Navigate to league settings
      await page.getByTestId('league-settings-tab').click();
      await page.getByTestId('edit-league-button').click();

      // Modify settings
      await page.getByTestId('league-name-input').fill(`${leagueName} (Updated)`);
      await page.getByTestId('max-teams-select').selectOption('12');
      await page.getByTestId('scoring-type-select').selectOption('standard');

      // Save changes
      await page.getByTestId('save-league-changes-button').click();

      // Verify changes were saved
      await expect(page.getByTestId('league-name')).toContainText('(Updated)');
      await expect(page.getByTestId('max-teams-display')).toContainText('12');
      await expect(page.getByTestId('scoring-type-display')).toContainText('Standard');
    });

    test('should generate shareable league invite link', async () => {
      // Create a league first
      await page.getByTestId('create-league-button').click();
      const leagueName = generateLeagueName();
      
      await page.getByTestId('league-name-input').fill(leagueName);
      await page.getByTestId('create-league-submit-button').click();

      // Navigate to invite section
      await page.getByTestId('league-members-tab').click();
      await page.getByTestId('invite-members-button').click();

      // Generate invite link
      await page.getByTestId('generate-invite-link-button').click();
      
      // Verify invite link is generated
      const inviteLink = await page.getByTestId('invite-link-input').inputValue();
      expect(inviteLink).toContain('/leagues/join/');
      expect(inviteLink.length).toBeGreaterThan(30);

      // Copy invite link functionality
      await page.getByTestId('copy-invite-link-button').click();
      await expect(page.getByTestId('copy-success-message')).toBeVisible();
    });
  });

  test.describe('League Joining Flow', () => {
    let leagueInviteCode: string;

    test.beforeEach(async () => {
      // Create a league with the first user
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Create league
      await page.getByTestId('create-league-button').click();
      await page.getByTestId('league-name-input').fill(generateLeagueName());
      await page.getByTestId('create-league-submit-button').click();

      // Get invite code
      await page.getByTestId('league-members-tab').click();
      await page.getByTestId('invite-members-button').click();
      await page.getByTestId('generate-invite-link-button').click();
      const inviteLink = await page.getByTestId('invite-link-input').inputValue();
      leagueInviteCode = inviteLink.split('/').pop() || '';

      // Logout
      await page.getByTestId('user-menu-button').click();
      await page.getByTestId('logout-button').click();
    });

    test('should allow new user to join league via invite link', async () => {
      const newUser = {
        email: generateTestEmail(),
        username: generateTestUsername(),
        password: 'TestPassword123!',
        firstName: 'New',
        lastName: 'Member'
      };

      // 1. Create new user account
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(newUser.email);
      await page.getByTestId('username-input').fill(newUser.username);
      await page.getByTestId('password-input').fill(newUser.password);
      await page.getByTestId('confirm-password-input').fill(newUser.password);
      await page.getByTestId('first-name-input').fill(newUser.firstName);
      await page.getByTestId('last-name-input').fill(newUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // 2. Navigate to league join page using invite code
      await page.goto(`/leagues/join/${leagueInviteCode}`);

      // 3. Review league details
      await expect(page.getByTestId('league-preview-name')).toBeVisible();
      await expect(page.getByTestId('league-preview-commissioner')).toBeVisible();
      await expect(page.getByTestId('league-preview-settings')).toBeVisible();

      // 4. Enter team name
      await page.getByTestId('team-name-input').fill('New Member Team');

      // 5. Join league
      await page.getByTestId('join-league-button').click();

      // 6. Verify successful join
      await expect(page).toHaveURL(/\/leagues\/[a-z0-9-]+$/);
      await expect(page.getByTestId('join-success-message')).toBeVisible();
      await expect(page.getByTestId('team-name-display')).toContainText('New Member Team');
      
      // 7. Verify member appears in league roster
      await page.getByTestId('league-members-tab').click();
      await expect(page.getByTestId('member-list')).toContainText(newUser.firstName);
    });

    test('should prevent joining full league', async () => {
      // This test would require creating a league with max teams set to 1
      // and having that spot already filled, then attempting to join
      
      // Create new user
      const newUser = {
        email: generateTestEmail(),
        username: generateTestUsername(),
        password: 'TestPassword123!'
      };

      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(newUser.email);
      await page.getByTestId('username-input').fill(newUser.username);
      await page.getByTestId('password-input').fill(newUser.password);
      await page.getByTestId('confirm-password-input').fill(newUser.password);
      await page.getByTestId('first-name-input').fill('Test');
      await page.getByTestId('last-name-input').fill('User');
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Try to join full league (mocked scenario)
      await page.goto(`/leagues/join/full-league-code`);
      
      // Verify error message for full league
      await expect(page.getByTestId('league-full-error')).toBeVisible();
      await expect(page.getByTestId('join-league-button')).toBeDisabled();
    });

    test('should validate team name during join process', async () => {
      const newUser = {
        email: generateTestEmail(),
        username: generateTestUsername(),
        password: 'TestPassword123!'
      };

      // Create new user
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(newUser.email);
      await page.getByTestId('username-input').fill(newUser.username);
      await page.getByTestId('password-input').fill(newUser.password);
      await page.getByTestId('confirm-password-input').fill(newUser.password);
      await page.getByTestId('first-name-input').fill('Test');
      await page.getByTestId('last-name-input').fill('User');
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Navigate to join page
      await page.goto(`/leagues/join/${leagueInviteCode}`);

      // Test empty team name
      await page.getByTestId('join-league-button').click();
      await expect(page.getByTestId('team-name-error')).toBeVisible();
      await expect(page.getByTestId('team-name-error')).toContainText('required');

      // Test team name that's too long
      await page.getByTestId('team-name-input').fill('A'.repeat(51)); // Assuming 50 char limit
      await page.getByTestId('join-league-button').click();
      await expect(page.getByTestId('team-name-error')).toContainText('too long');

      // Test valid team name
      await page.getByTestId('team-name-input').fill('Valid Team Name');
      await page.getByTestId('join-league-button').click();
      
      // Should proceed without error
      await expect(page.getByTestId('team-name-error')).not.toBeVisible();
    });
  });

  test.describe('Dashboard and League Management', () => {
    test.beforeEach(async () => {
      // Create user and league
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();
    });

    test('should display user dashboard with league overview', async () => {
      // Verify dashboard elements
      await expect(page.getByTestId('dashboard-title')).toContainText('Dashboard');
      await expect(page.getByTestId('user-welcome')).toContainText(testUser.firstName);
      
      // Check dashboard sections
      await expect(page.getByTestId('my-leagues-section')).toBeVisible();
      await expect(page.getByTestId('recent-activity-section')).toBeVisible();
      await expect(page.getByTestId('quick-actions-section')).toBeVisible();

      // Check quick actions
      await expect(page.getByTestId('create-league-button')).toBeVisible();
      await expect(page.getByTestId('join-league-button')).toBeVisible();
      await expect(page.getByTestId('browse-leagues-button')).toBeVisible();
    });

    test('should navigate between different dashboard sections', async () => {
      // Navigate to leagues section
      await page.getByTestId('my-leagues-tab').click();
      await expect(page.getByTestId('leagues-list')).toBeVisible();

      // Navigate to teams section
      await page.getByTestId('my-teams-tab').click();
      await expect(page.getByTestId('teams-list')).toBeVisible();

      // Navigate to activity section
      await page.getByTestId('activity-tab').click();
      await expect(page.getByTestId('activity-feed')).toBeVisible();

      // Navigate back to overview
      await page.getByTestId('overview-tab').click();
      await expect(page.getByTestId('dashboard-overview')).toBeVisible();
    });

    test('should handle league search and filtering', async () => {
      // Create a few leagues first
      const leagues = ['League Alpha', 'League Beta', 'League Charlie'];
      
      for (const leagueName of leagues) {
        await page.getByTestId('create-league-button').click();
        await page.getByTestId('league-name-input').fill(leagueName);
        await page.getByTestId('create-league-submit-button').click();
        await page.goto('/dashboard');
      }

      // Test search functionality
      await page.getByTestId('my-leagues-tab').click();
      await page.getByTestId('league-search-input').fill('Alpha');
      
      await expect(page.getByTestId('leagues-list')).toContainText('League Alpha');
      await expect(page.getByTestId('leagues-list')).not.toContainText('League Beta');

      // Clear search
      await page.getByTestId('league-search-input').fill('');
      await expect(page.getByTestId('leagues-list')).toContainText('League Alpha');
      await expect(page.getByTestId('leagues-list')).toContainText('League Beta');

      // Test status filter
      await page.getByTestId('league-status-filter').selectOption('forming');
      // All leagues should be visible as they're newly created
      await expect(page.getByTestId('leagues-list')).toContainText('League Alpha');
    });
  });

  test.describe('Real-time Features', () => {
    test('should receive real-time notifications for league updates', async () => {
      // This test would require setting up WebSocket connections
      // and simulating real-time events. This is a simplified version.

      // Create user and join a league
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Create league
      await page.getByTestId('create-league-button').click();
      await page.getByTestId('league-name-input').fill(generateLeagueName());
      await page.getByTestId('create-league-submit-button').click();

      // Check for notification system setup
      await expect(page.getByTestId('notification-center')).toBeVisible();
      
      // Simulate a notification (this would normally come from WebSocket)
      await page.evaluate(() => {
        // Simulate receiving a real-time notification
        window.dispatchEvent(new CustomEvent('league-notification', {
          detail: {
            type: 'member-joined',
            message: 'A new member joined your league',
            timestamp: new Date().toISOString()
          }
        }));
      });

      // Verify notification appears
      await expect(page.getByTestId('notification-toast')).toBeVisible();
      await expect(page.getByTestId('notification-toast')).toContainText('new member joined');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Create user
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Check mobile navigation
      await expect(page.getByTestId('mobile-menu-button')).toBeVisible();
      await page.getByTestId('mobile-menu-button').click();
      await expect(page.getByTestId('mobile-menu')).toBeVisible();

      // Test mobile-specific create league flow
      await page.getByTestId('mobile-create-league-button').click();
      await expect(page).toHaveURL('/leagues/create');

      // Verify form is mobile-friendly
      await expect(page.getByTestId('league-name-input')).toBeVisible();
      await page.getByTestId('league-name-input').fill(generateLeagueName());
      
      // Check mobile form submission
      await page.getByTestId('create-league-submit-button').click();
      await expect(page).toHaveURL(/\/leagues\/[a-z0-9-]+$/);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Create user first
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Simulate network failure
      await page.route('**/api/leagues', route => route.abort());

      // Try to create league
      await page.getByTestId('create-league-button').click();
      await page.getByTestId('league-name-input').fill(generateLeagueName());
      await page.getByTestId('create-league-submit-button').click();

      // Verify error handling
      await expect(page.getByTestId('network-error-message')).toBeVisible();
      await expect(page.getByTestId('retry-button')).toBeVisible();
    });

    test('should handle invalid league invite codes', async () => {
      // Create user
      await page.goto('/auth/signup');
      await page.getByTestId('email-input').fill(testUser.email);
      await page.getByTestId('username-input').fill(testUser.username);
      await page.getByTestId('password-input').fill(testUser.password);
      await page.getByTestId('confirm-password-input').fill(testUser.password);
      await page.getByTestId('first-name-input').fill(testUser.firstName);
      await page.getByTestId('last-name-input').fill(testUser.lastName);
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('submit-signup-button').click();

      // Try to join with invalid invite code
      await page.goto('/leagues/join/invalid-code-123');

      // Verify error message
      await expect(page.getByTestId('invalid-invite-error')).toBeVisible();
      await expect(page.getByTestId('invalid-invite-error')).toContainText('Invalid or expired');
      
      // Verify redirect to dashboard option
      await expect(page.getByTestId('back-to-dashboard-button')).toBeVisible();
      await page.getByTestId('back-to-dashboard-button').click();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle session expiration', async () => {
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

      // Simulate expired session by clearing tokens
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        sessionStorage.clear();
      });

      // Try to access protected page
      await page.goto('/leagues/create');

      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
      await expect(page.getByTestId('session-expired-message')).toBeVisible();
    });
  });
});