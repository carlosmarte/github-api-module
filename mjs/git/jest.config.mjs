export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {},
  testMatch: [
    '**/__tests__/**/*.test.mjs'
  ],
  collectCoverageFrom: [
    '**/*.mjs',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!jest.config.mjs'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};