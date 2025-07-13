/**
 * Jest configuration for GitHub Users API module
 */

export default {
  // Transform settings
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Test settings
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.mjs',
    '**/tests/**/*.spec.mjs',
    '**/__tests__/**/*.test.mjs',
    '**/__tests__/**/*.spec.mjs'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/**/*.test.mjs',
    '!src/**/*.spec.mjs'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.mjs'],
  
  // Module settings
  moduleFileExtensions: ['mjs', 'js', 'json'],
  moduleDirectories: ['node_modules', 'src'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true
};