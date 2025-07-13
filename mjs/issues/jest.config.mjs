export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['mjs', 'js', 'json'],
  testMatch: [
    '**/__tests__/**/*.mjs',
    '**/__tests__/**/*.spec.mjs',
    '**/__tests__/**/*.test.mjs'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    '**/*.mjs',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/examples/**',
    '!jest.config.mjs'
  ]
};