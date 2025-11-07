# GitHub Pull Request API Module - Test Suite

This directory contains comprehensive Jest tests for the GitHub Pull Request API module, designed to work with ES modules and provide thorough coverage of all functionality.

## Test Structure

```
__tests__/
├── jest.config.mjs          # Jest configuration for ES modules
├── setup.mjs               # Global test setup and mocks
├── run-tests.mjs           # Test runner script
├── index.test.mjs          # Tests for main exports and convenience functions
├── lib/
│   ├── client.test.mjs     # Tests for PullRequestClient class
│   ├── auth.test.mjs       # Tests for authentication helper
│   └── config.test.mjs     # Tests for configuration loader
└── utils/
    ├── errors.test.mjs     # Tests for custom error classes
    ├── format.test.mjs     # Tests for formatting utilities
    └── pagination.test.mjs # Tests for pagination helper
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/lib/client.test.mjs

# Run tests matching pattern
npm test -- --testNamePattern="PullRequestClient"
```

### Using the Test Runner

```bash
# Run with the custom ES module test runner
node __tests__/run-tests.mjs

# Run specific test file
node __tests__/run-tests.mjs __tests__/lib/client.test.mjs

# Run with additional Jest options
node __tests__/run-tests.mjs --coverage --verbose
```

## Test Features

### ES Module Support
- Configured for ES modules with `--experimental-vm-modules`
- Uses `@jest/globals` imports
- Proper module mocking with `jest.unstable_mockModule()`

### HTTP Mocking
- Uses `nock` for HTTP request mocking
- Realistic GitHub API response mocking
- Proper cleanup between tests

### Comprehensive Coverage
- **100% code coverage** target for critical paths
- Tests for both success and failure scenarios
- Edge case handling
- Error condition testing

### Test Data
- Shared mock data in `setup.mjs`
- Realistic GitHub API response structures
- Helper functions for common test scenarios

## Test Categories

### Unit Tests

#### index.test.mjs
- Module exports verification
- Convenience function testing
- Client creation and configuration
- Error propagation

#### lib/client.test.mjs
- All PullRequestClient methods
- HTTP request handling
- Authentication
- Repository validation
- Pagination support
- Error handling

#### lib/auth.test.mjs
- Token retrieval from environment
- Token validation patterns
- Authentication testing
- Scope checking
- Error scenarios

#### lib/config.test.mjs
- Configuration loading from files
- Environment variable overrides
- Repository parsing
- Git remote detection
- Config file operations

#### utils/errors.test.mjs
- Custom error class functionality
- Error message formatting
- API error handling
- Rate limit error behavior
- Validation error formatting

#### utils/format.test.mjs
- Date formatting (absolute and relative)
- Pull request formatting
- Table creation
- State and review state formatting
- File change formatting
- JSON output formatting

#### utils/pagination.test.mjs
- Link header parsing
- Page number extraction
- Pagination generators
- Cursor-based pagination
- Rate limit handling in pagination
- Page calculation utilities

## Mock Strategy

### HTTP Mocking
```javascript
// Mock successful API response
nock('https://api.github.com')
  .get('/repos/owner/repo/pulls/1')
  .reply(200, mockPullRequest);

// Mock API error
nock('https://api.github.com')
  .get('/repos/owner/repo/pulls/999')
  .reply(404, { message: 'Not Found' });
```

### Module Mocking
```javascript
// Mock external dependencies
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

// Mock file system operations
jest.mock('fs');
```

## Test Data

The `setup.mjs` file provides shared mock data:
- `mockPullRequest` - Complete PR object
- `mockUser` - GitHub user object
- `mockReview` - PR review object
- `mockComment` - Review comment object
- `mockCommit` - Commit object
- `mockFile` - Changed file object

## Coverage Goals

- **Critical paths**: 100% coverage
- **Error handling**: All error types tested
- **Edge cases**: Null/undefined/invalid inputs
- **Integration points**: Module interactions
- **API contracts**: All public methods

## Best Practices

### Test Organization
- Group related tests with `describe` blocks
- Clear, descriptive test names
- Setup and teardown in `beforeEach`/`afterEach`
- Shared test data in global setup

### Assertions
- Use specific matchers (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify function calls with `toHaveBeenCalledWith`
- Check error types and messages

### Mocking
- Mock external dependencies consistently
- Clean up mocks between tests
- Use realistic mock data
- Verify mock calls

### Error Testing
```javascript
// Test error throwing
await expect(client.get(999))
  .rejects.toThrow(NotFoundError);

// Test error properties
try {
  await client.get(999);
  fail('Should have thrown');
} catch (error) {
  expect(error.status).toBe(404);
  expect(error.name).toBe('NotFoundError');
}
```

## Debugging Tests

### Running Single Tests
```bash
# Run specific test file
npm test -- __tests__/lib/client.test.mjs

# Run specific test case
npm test -- --testNamePattern="creates client with default options"

# Debug mode
npm test -- --runInBand --detectOpenHandles
```

### Common Issues

1. **ES Module Import Errors**
   - Ensure `--experimental-vm-modules` is set
   - Use proper `import` statements
   - Check module mocking syntax

2. **Async Test Issues**
   - Always `await` async operations
   - Use `async/await` consistently
   - Handle promise rejections properly

3. **Mock Cleanup**
   - Clear mocks in `beforeEach`/`afterEach`
   - Reset nock interceptors
   - Restore environment variables

## Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Add both success and failure cases
3. Include edge case testing
4. Update coverage expectations
5. Add realistic mock data
6. Document complex test scenarios

## Environment Variables

Tests handle various environment configurations:
- `GITHUB_TOKEN` - Authentication token
- `NODE_ENV=test` - Test environment
- `NODE_OPTIONS=--experimental-vm-modules` - ES module support