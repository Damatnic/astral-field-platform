# Astral Field Testing Guide

This comprehensive guide covers the testing infrastructure and practices for the Astral Field fantasy football platform.

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Astral Field employs a comprehensive testing strategy that includes:

- **Unit Tests**: Testing individual components and functions in isolation
- **Integration Tests**: Testing API endpoints and database interactions
- **End-to-End Tests**: Testing complete user workflows across the application
- **Performance Tests**: Testing system performance under load
- **Visual Regression Tests**: Testing UI consistency across changes

## Testing Philosophy

Our testing approach follows these principles:

### 1. Test Pyramid
- **70% Unit Tests**: Fast, reliable, and cover individual functions
- **20% Integration Tests**: Verify system components work together
- **10% E2E Tests**: Validate critical user journeys

### 2. Testing Priorities
1. **Business Critical Features**: Draft system, scoring, trades
2. **User-Facing Features**: Authentication, dashboard, league management
3. **Data Integrity**: Player stats, league settings, user data
4. **Performance**: Load handling, real-time updates

### 3. Quality Standards
- Minimum 75% overall code coverage
- 85% coverage for service layer
- All critical paths must have E2E coverage
- Performance tests for high-traffic scenarios

## Test Types

### Unit Tests

Unit tests focus on testing individual components, functions, and services in isolation.

#### Technologies Used
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking

#### Directory Structure
```
src/
├── components/
│   └── __tests__/
│       └── ComponentName.test.tsx
├── services/
│   └── __tests__/
│       └── serviceName.test.ts
└── lib/
    └── __tests__/
        └── utilityName.test.ts
```

#### Example Unit Test
```typescript
// src/services/ai/__tests__/predictionEngine.test.ts
import { aiPredictionEngine } from '../predictionEngine';

describe('AIPredictionEngine', () => {
  it('should generate accurate player predictions', async () => {
    const prediction = await aiPredictionEngine.generatePlayerPrediction('player-123', 8);
    
    expect(prediction).toMatchObject({
      playerId: 'player-123',
      week: 8,
      projectedPoints: expect.any(Number),
      confidence: expect.any(Number),
    });
    
    expect(prediction.projectedPoints).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

Integration tests verify that different parts of the system work together correctly.

#### Technologies Used
- **Jest**: Test runner
- **Supertest**: HTTP request testing
- **Test Database**: Isolated PostgreSQL instance

#### Directory Structure
```
__tests__/
└── integration/
    ├── api/
    │   ├── leagues.integration.test.ts
    │   ├── players.integration.test.ts
    │   └── draft.integration.test.ts
    └── services/
        ├── database.integration.test.ts
        └── websocket.integration.test.ts
```

#### Example Integration Test
```typescript
// __tests__/integration/api/leagues.integration.test.ts
describe('/api/leagues Integration Tests', () => {
  it('should create a new league with valid data', async () => {
    const response = await request(app)
      .post('/api/leagues')
      .send({
        name: 'Test League 2025',
        commissioner_id: testUser.id,
        max_teams: 12,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Test League 2025',
      status: 'draft',
    });
  });
});
```

### End-to-End Tests

E2E tests validate complete user workflows using Playwright.

#### Technologies Used
- **Playwright**: Browser automation and testing
- **Multiple Browsers**: Chrome, Firefox, Safari, Mobile viewports

#### Directory Structure
```
e2e/
├── global-setup.ts
├── global-teardown.ts
├── league-management.spec.ts
├── draft-workflow.spec.ts
├── trade-system.spec.ts
└── mobile-responsive.spec.ts
```

#### Example E2E Test
```typescript
// e2e/league-management.spec.ts
test('should create a new league successfully', async ({ page }) => {
  await page.goto('/leagues/create');
  
  await page.fill('[data-testid=league-name-input]', 'E2E Test League');
  await page.selectOption('[data-testid=max-teams-select]', '8');
  await page.click('[data-testid=create-league-button]');
  
  await expect(page).toHaveURL(/\/leagues\/[a-zA-Z0-9-]+/);
  await expect(page.locator('[data-testid=league-name]')).toContainText('E2E Test League');
});
```

### Performance Tests

Performance tests ensure the system handles expected load and performs well.

#### Technologies Used
- **k6**: Load testing framework
- **Custom Metrics**: Response times, error rates, throughput

#### Test Scenarios
- **Normal Load**: 100 concurrent users
- **Peak Load**: 500 concurrent users
- **Stress Test**: 1000+ concurrent users
- **WebSocket Load**: 500+ concurrent connections

#### Example Performance Test
```javascript
// performance-tests/load-test.js
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

## Running Tests

### Local Development

#### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/services/ai/__tests__/predictionEngine.test.ts
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage

# Run specific integration test
npm run test:integration -- __tests__/integration/api/leagues.integration.test.ts
```

#### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests on specific browser
npx playwright test --project=chromium

# Run specific E2E test
npx playwright test e2e/league-management.spec.ts
```

#### Performance Tests
```bash
# Run performance tests
npm run test:performance

# Run with custom configuration
k6 run --vus 100 --duration 5m performance-tests/load-test.js
```

### CI/CD Environment

Tests run automatically on:
- **Pull Requests**: Unit, integration, and E2E tests
- **Main Branch**: Full test suite including performance tests
- **Nightly**: Extended performance and stress tests

## Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
describe('Component/Service Name', () => {
  // Setup
  beforeEach(() => {
    // Arrange: Set up test data and mocks
  });

  it('should describe expected behavior', () => {
    // Arrange: Prepare test data
    const input = 'test data';
    
    // Act: Execute the functionality
    const result = functionUnderTest(input);
    
    // Assert: Verify the results
    expect(result).toBe(expectedValue);
  });
});
```

### Test Data Management

#### Use Factory Functions
```typescript
// test-utils/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  ...overrides,
});

export const createMockLeague = (overrides = {}) => ({
  id: 'league-123',
  name: 'Test League',
  commissioner_id: 'user-123',
  ...overrides,
});
```

#### Use Test Utilities
```typescript
// test-utils/index.ts
export const renderWithProviders = (ui: ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    ),
    ...options,
  });
};
```

### Mocking Guidelines

#### Mock External Dependencies
```typescript
// Mock API calls
jest.mock('@/services/api/nflDataService', () => ({
  getPlayerStats: jest.fn(),
  getTeamSchedule: jest.fn(),
}));

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
```

#### Mock WebSocket Connections
```typescript
// Mock WebSocket for testing real-time features
jest.mock('@/lib/websocket/client', () => ({
  getWebSocketClient: jest.fn(() => ({
    connect: jest.fn(),
    subscribe: jest.fn(),
    emit: jest.fn(),
  })),
}));
```

### Testing Async Code

#### Testing Promises
```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toBe(expectedValue);
});

it('should handle errors', async () => {
  const promise = asyncFunction();
  await expect(promise).rejects.toThrow('Expected error');
});
```

#### Testing React Hooks
```typescript
it('should update state correctly', async () => {
  render(<ComponentUsingHook />);
  
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Updated text')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

### Overall Targets
- **Project Coverage**: 75% minimum
- **Services Layer**: 85% minimum
- **Components**: 75% minimum
- **API Routes**: 80% minimum
- **Utilities**: 90% minimum

### Coverage Reports

#### Viewing Coverage
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

#### Coverage in CI/CD
- Coverage reports uploaded to Codecov
- PR comments show coverage changes
- Coverage gates prevent merging if below threshold

### Improving Coverage

#### Identify Uncovered Code
```bash
# Show uncovered lines
npm run test:coverage -- --verbose

# Generate detailed report
npx jest --coverage --coverageReporters=text-lcov
```

#### Add Missing Tests
1. Review coverage report
2. Identify critical uncovered paths
3. Write tests for business logic first
4. Add edge case tests
5. Test error handling paths

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Code Quality**: Linting, type checking, formatting
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: Database and API testing
4. **E2E Tests**: Critical user journey validation
5. **Performance Tests**: Load and stress testing
6. **Security Scanning**: Vulnerability detection
7. **Deployment**: Automated staging and production deploys

### Test Environments

#### Staging Environment
- Full production-like setup
- Test data populated
- Performance monitoring enabled
- Smoke tests after deployment

#### Production Environment
- Blue-green deployment
- Health checks before traffic routing
- Rollback capability
- Post-deployment monitoring

## Best Practices

### 1. Test Naming
```typescript
// Good: Descriptive test names
it('should return validation error when email is invalid', () => {});

// Bad: Vague test names
it('should work correctly', () => {});
```

### 2. Test Organization
- Group related tests with `describe`
- Use `beforeEach` for common setup
- Keep tests focused and atomic
- One assertion per test concept

### 3. Mock Strategy
- Mock external dependencies
- Use real objects for internal code
- Mock at the system boundary
- Keep mocks simple and focused

### 4. Data Management
- Use factories for test data
- Isolate test data between tests
- Clean up after tests
- Use meaningful test data

### 5. Performance
- Keep unit tests fast (< 100ms)
- Use `only` and `skip` during development
- Parallelize tests when possible
- Mock expensive operations

### 6. Maintainability
- Update tests when refactoring
- Remove obsolete tests
- Keep test code clean
- Document complex test scenarios

## Troubleshooting

### Common Issues

#### Tests Timing Out
```typescript
// Increase timeout for specific tests
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Or configure globally in jest.config.js
module.exports = {
  testTimeout: 10000,
};
```

#### Flaky Tests
```typescript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
}, { timeout: 5000 });

// Mock time-dependent code
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-01-01'));
```

#### Memory Leaks
```typescript
// Clean up subscriptions
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // React Testing Library cleanup
});

// Clear timers
afterEach(() => {
  jest.clearAllTimers();
});
```

#### Environment Issues
```bash
# Clear Jest cache
npm run test -- --clearCache

# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version # Should be 18.x or higher
```

### Debugging Tests

#### Debug Single Test
```bash
# Run single test with debug output
npm run test -- --verbose src/path/to/test.ts

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand src/path/to/test.ts
```

#### Debug E2E Tests
```bash
# Run with headed browser
npx playwright test --headed

# Debug mode with browser dev tools
npx playwright test --debug

# Run with specific browser
npx playwright test --project=chromium
```

#### Debug Performance Tests
```bash
# Run with verbose output
k6 run --verbose performance-tests/load-test.js

# Check system resources during test
htop # Monitor CPU and memory usage
```

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Performance Testing](https://k6.io/docs/)

### Tools and Extensions
- VS Code Jest Extension
- React Developer Tools
- Playwright Test for VS Code
- Chrome DevTools for debugging

### Internal Resources
- [API Documentation](./api-reference.md)
- [Component Style Guide](./component-guide.md)
- [Database Schema](./database-schema.md)
- [Performance Benchmarks](./performance-benchmarks.md)

---

For questions or support with testing, reach out to the development team or create an issue in the repository.