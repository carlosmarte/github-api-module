export default {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.mjs',
    '**/__tests__/**/*.spec.mjs'
  ],
  collectCoverageFrom: [
    '../lib/**/*.mjs',
    '../utils/**/*.mjs',
    '../index.mjs'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setup.mjs'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // ES Module support
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.mjs$': '$1.mjs'
  },
  transform: {}
};