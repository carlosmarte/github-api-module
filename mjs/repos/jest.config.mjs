/**
 * Jest configuration for ES modules
 */

export default {
  // Use ES modules
  preset: null,
  testEnvironment: 'node',
  // Module handling
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform settings
  transform: {},
  
  // Test files
  testMatch: [
    '<rootDir>/tests/**/*.test.mjs',
    '<rootDir>/tests/**/*.spec.mjs'
  ],
  
  // Coverage settings
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/**/*.test.mjs',
    '!src/**/*.spec.mjs',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.mjs'],
  
  // Test environment
  testTimeout: 30000,
  
  // Mock settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/examples/'
  ]
};