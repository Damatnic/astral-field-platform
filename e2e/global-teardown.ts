import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Clean up test data
    console.log('🗑️  Cleaning up test environment...');
    
    try {
      const baseURL = config.use?.baseURL || 'http://localhost:3000';
      await page.goto(baseURL);

      const response = await page.request.post('/api/test-setup', {
        data: {
          action: 'cleanup',
          testData: {
            userIds: ['test-user-1', 'test-user-2'],
            leagueIds: ['test-league-1'],
          },
        },
      });

      if (response.ok()) {
        console.log('✅ Test data cleanup complete');
      }
    } catch (error) {
      console.log('⚠️  Test data cleanup skipped (endpoint may not exist)');
    }

    // Clean up auth state
    try {
      const fs = await import('fs/promises');
      await fs.unlink('./e2e/auth-state.json');
      console.log('✅ Auth state cleaned up');
    } catch (error) {
      // File may not exist, which is fine
    }

    await browser.close();
    
    console.log('✅ Global teardown complete!');
  } catch (error) {
    console.error('⚠️  Global teardown failed (non-critical):', error);
    // Don't throw error here as teardown failures shouldn't fail the test run
  }
}

export default globalTeardown;