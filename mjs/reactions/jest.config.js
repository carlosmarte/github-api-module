export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/test/**/*.test.mjs'],
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/cli.mjs'
  ]
};