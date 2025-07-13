export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['mjs', 'js', 'json'],
  testMatch: ['**/__tests__/**/*.mjs', '**/*.test.mjs', '**/*.spec.mjs'],
  collectCoverageFrom: [
    '*.mjs',
    'commands/**/*.mjs',
    'models/**/*.mjs',
    'utils/**/*.mjs',
    '!node_modules/**',
    '!test*.mjs',
    '!jest.config.mjs'
  ],
  coverageReporters: ['text', 'text-summary', 'html'],
  verbose: true
};