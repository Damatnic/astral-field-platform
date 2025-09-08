/**
 * Jest Configuration for NFL Data Service Tests
 * Comprehensive test setup with coverage, mocking, and performance monitoring
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../../$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '../**/*.ts',
    '!../**/*.d.ts',
    '!../**/*.test.ts',
    '!../**/*.spec.ts',
    '!../tests/**',
    '!../node_modules/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'cobertura'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/nfl/dataProvider.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/services/nfl/cache/RedisCache.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/services/nfl/validation/DataValidator.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectLeaks: true,
  detectOpenHandles: true,
  
  // Parallel execution
  maxWorkers: '50%',
  
  // Test results processing
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/coverage',
      outputName: 'junit.xml',
      suiteName: 'NFL Data Service Tests'
    }],
    ['jest-html-reporters', {
      publicDir: '<rootDir>/coverage',
      filename: 'test-report.html',
      openReport: false
    }]
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }
  },
  
  // Module transformation
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Force exit after tests complete
  forceExit: true,
  
  // Run tests serially instead of in parallel for debugging
  // maxWorkers: 1,
  
  // Bail after first test failure (useful for CI)
  // bail: 1,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/'
  ],
  
  // Custom matchers
  setupFiles: [],
  
  // Test result processors
  testResultsProcessor: undefined,
  
  // Snapshot serializers
  snapshotSerializers: [],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/../../../node_modules'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/'
  ],
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/'
  ],
  
  // Mock patterns
  unmockedModulePathPatterns: [],
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Dependency extraction
  dependencyExtractor: undefined,
  
  // Display name
  displayName: {
    name: 'NFL Data Service',
    color: 'blue'
  },
  
  // Project configuration for multi-project setups
  projects: undefined,
  
  // Root directory
  rootDir: '.',
  
  // Roots
  roots: [
    '<rootDir>'
  ],
  
  // Run in band (serial execution)
  runInBand: false,
  
  // Silent mode
  silent: false,
  
  // Skip filter
  skipFilter: false,
  
  // Update snapshots
  updateSnapshot: false,
  
  // Use stderr
  useStderr: false,
  
  // Watch mode
  watch: false,
  watchAll: false,
  
  // Custom test sequencer
  testSequencer: undefined,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(some-module-to-transform)/)'
  ]
};