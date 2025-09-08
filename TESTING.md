# Comprehensive Testing Framework

This document provides complete instructions for running the comprehensive testing framework for the Astral Field fantasy football platform.

## Overview

The testing framework includes:
- **Unit Tests**: Comprehensive coverage for all services and utilities
- **Integration Tests**: API endpoint testing with real database connections
- **End-to-End Tests**: Complete user flow testing with Playwright
- **Load Tests**: Performance testing for high-traffic scenarios
- **Security Tests**: OWASP Top 10 vulnerability testing
- **Visual Regression Tests**: UI consistency testing across browsers
- **CI/CD Integration**: Automated testing in GitHub Actions

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Run comprehensive test suite (sequential)
npm run test:comprehensive

# Run comprehensive test suite (parallel - faster)
npm run test:comprehensive:parallel

# Run only unit and integration tests (fast)
npm run test:comprehensive:fast

# Run with verbose output
npm run test:comprehensive:verbose
```

## Individual Test Types

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode (for debugging)
npm run test:e2e:ui
```

### Visual Regression Tests
```bash
npx playwright test visual-tests/
```

### Load Tests
```bash
# Authentication load tests
k6 run load-tests/scenarios/authentication.load.js

# Fantasy operations load tests
k6 run load-tests/scenarios/fantasy-operations.load.js
```

### Security Tests
```bash
# OWASP Top 10 security tests
k6 run security-tests/owasp-top10.test.js
```

## Test Runner Options

The comprehensive test runner (`scripts/test-runner.js`) supports various options:

```bash
# Basic usage
node scripts/test-runner.js

# Run tests in parallel
node scripts/test-runner.js --parallel

# Stop on first failure
node scripts/test-runner.js --fail-fast

# Show detailed output
node scripts/test-runner.js --verbose

# Skip report generation
node scripts/test-runner.js --no-report

# Run specific test types
node scripts/test-runner.js --types unit,integration

# Combine options
node scripts/test-runner.js --parallel --verbose --fail-fast
```

Available test types:
- `unit`: Unit tests with Jest
- `integration`: Integration tests with database
- `e2e`: End-to-end tests with Playwright
- `visual`: Visual regression tests
- `security`: Security vulnerability tests
- `load`: Load and performance tests

## Environment Setup

### Prerequisites

1. **Node.js 18+**: Required for running tests
2. **Docker**: Required for integration tests (PostgreSQL, Redis)
3. **k6**: Required for load and security tests
4. **Playwright**: Required for E2E and visual tests

### Database Setup

For integration and E2E tests, ensure database services are running:

```bash
# Start services with Docker Compose
docker compose up -d postgres redis

# Or use the test runner (it will start services automatically)
npm run test:comprehensive
```

### Environment Variables

Create test-specific environment files:

```bash
# .env.test
DATABASE_URL=postgresql://test:test@localhost:5432/astral_field_test
REDIS_URL=redis://localhost:6379
NODE_ENV=test
```

```bash
# .env.test.local (for local overrides)
SKIP_ENV_VALIDATION=true
```

## Test Coverage

### Coverage Requirements

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 75%+ coverage for API endpoints
- **E2E Tests**: Critical user flows coverage

### Coverage Reports

After running tests with coverage, reports are available in:
- `coverage/`: Unit test coverage
- `coverage/integration/`: Integration test coverage
- `test-reports/`: Consolidated reports

### Viewing Coverage

```bash
# Open HTML coverage reports
open coverage/lcov-report/index.html
open coverage/integration/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions

The comprehensive testing pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Daily schedule at 2 AM UTC (nightly tests)

### Manual Trigger

You can manually trigger tests with commit messages:
- `[security-test]`: Runs security tests
- `[load-test]`: Runs load tests
- `[full-test]`: Runs all test types

### Pipeline Jobs

1. **Code Quality**: ESLint, TypeScript, Prettier, Security audit
2. **Unit Tests**: Jest with coverage (Node.js 18, 20)
3. **Integration Tests**: API testing with PostgreSQL/Redis
4. **E2E Tests**: Playwright across browsers (Chromium, Firefox, WebKit)
5. **Visual Tests**: Visual regression testing
6. **Security Tests**: OWASP Top 10 testing (scheduled/manual)
7. **Load Tests**: Performance testing (main branch only)
8. **Lighthouse**: Performance auditing
9. **Deployment Tests**: Production build validation

## Test Data Management

### Test Data Generation

Use the test utilities for consistent test data:

```typescript
import { TestDataGenerator } from '../test-utils';

const testUser = TestDataGenerator.user();
const testLeague = TestDataGenerator.league();
const testPlayer = TestDataGenerator.nflPlayer();
```

### Database Isolation

Integration tests use transaction isolation:
- Each test runs in a separate transaction
- Automatic rollback after each test
- No test data pollution between tests

### Mock Data

Unit tests use comprehensive mocking:
- Service mocks in `__mocks__/`
- API response mocks with MSW
- Real-time data simulation

## Performance Testing

### Load Test Scenarios

1. **Authentication Load**: 50 concurrent users, 5 minutes
2. **Fantasy Operations**: 100 concurrent users, draft operations
3. **Real-time Updates**: WebSocket connection stress testing

### Performance Thresholds

- **Response Time**: < 200ms for API endpoints
- **Throughput**: 1000+ requests/second
- **Concurrent Users**: 10,000+ supported
- **Memory Usage**: < 512MB under load

### Monitoring

Load tests generate detailed reports:
- Response time percentiles
- Throughput metrics
- Error rates
- Resource utilization

## Security Testing

### OWASP Top 10 Coverage

1. **Injection**: SQL injection, NoSQL injection testing
2. **Broken Authentication**: Session management, password policies
3. **Sensitive Data Exposure**: Data encryption, secure transmission
4. **XML External Entities**: XXE attack prevention
5. **Broken Access Control**: Authorization testing
6. **Security Misconfiguration**: Configuration validation
7. **Cross-Site Scripting**: XSS prevention testing
8. **Insecure Deserialization**: Object injection testing
9. **Known Vulnerabilities**: Dependency scanning
10. **Insufficient Logging**: Security event logging

### Security Test Reports

Security tests generate:
- Vulnerability assessment reports
- Penetration test results
- Compliance validation reports

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 5432 (PostgreSQL) and 6379 (Redis) are available
2. **Database Connection**: Check Docker services are running
3. **Timeout Issues**: Increase test timeouts for slow environments
4. **Memory Issues**: Use `--maxWorkers=1` for limited memory environments

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm run test:comprehensive:verbose

# Run specific test with debugging
npx jest --runInBand --detectOpenHandles src/services/fantasy/__tests__/scoringEngine.test.ts
```

### Logs

Test execution logs are stored in:
- `test-logs/`: Test runner logs
- `test-reports/`: Generated reports
- `coverage/`: Coverage reports

## Best Practices

### Writing Tests

1. **Unit Tests**: Test pure functions and business logic
2. **Integration Tests**: Test API endpoints and database operations
3. **E2E Tests**: Test complete user workflows
4. **Visual Tests**: Test UI consistency and responsive design

### Test Organization

```
__tests__/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # End-to-end tests
├── visual-tests/         # Visual regression tests
├── load-tests/           # Load testing scenarios
├── security-tests/       # Security testing scripts
└── test-utils/          # Shared test utilities
```

### Continuous Improvement

1. **Monitor Coverage**: Maintain 90%+ unit test coverage
2. **Performance Benchmarks**: Track performance over time
3. **Security Updates**: Regular security testing and updates
4. **Test Maintenance**: Keep tests updated with code changes

## Support

For questions or issues with the testing framework:

1. Check the troubleshooting section above
2. Review test logs in `test-logs/`
3. Run tests with `--verbose` flag for detailed output
4. Check CI/CD pipeline logs for deployment issues

---

**Last Updated**: September 2025
**Framework Version**: 1.0.0
**Supported Node.js**: 18.x, 20.x