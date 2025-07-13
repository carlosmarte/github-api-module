export default {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.mjs'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.mjs$': '$1.mjs'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.mjs',
    'index.mjs',
    '!lib/**/*.test.mjs',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000
};