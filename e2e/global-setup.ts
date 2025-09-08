import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');

  try {
    // Launch a browser to check if the app is ready
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Wait for the development server to be ready
    const baseURL = config.use?.baseURL || 'http://localhost:3000';
    console.log(`⏳ Waiting for server at ${baseURL}...`);
    
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL);
        if (response?.ok()) {
          console.log('✅ Server is ready!');
          break;
        }
      } catch (error) {
        console.log(`⚠️  Server not ready, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      }
    }

    if (retries === 0) {
      throw new Error('❌ Server failed to start within timeout period');
    }

    // Set up test data
    console.log('🔧 Setting up test environment...');
    
    // Create test users and leagues if needed
    try {
      const response = await page.request.post('/api/test-setup', {
        data: {
          action: 'setup',
          testData: {
            users: [
              {
                id: 'test-user-1',
                email: 'test1@example.com',
                username: 'testuser1',
                full_name: 'Test User 1',
              },
              {
                id: 'test-user-2',
                email: 'test2@example.com',
                username: 'testuser2',
                full_name: 'Test User 2',
              },
            ],
            leagues: [
              {
                id: 'test-league-1',
                name: 'E2E Test League',
                commissioner_id: 'test-user-1',
                max_teams: 8,
                season_year: 2025,
                status: 'draft',
              },
            ],
          },
        },
      });

      if (response.ok()) {
        console.log('✅ Test data setup complete');
      }
    } catch (error) {
      console.log('⚠️  Test data setup skipped (endpoint may not exist in dev)');
    }

    // Store authentication state for tests
    await context.storageState({ path: './e2e/auth-state.json' });

    await browser.close();
    
    console.log('✅ Global setup complete!');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;