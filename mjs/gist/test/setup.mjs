import { jest } from '@jest/globals';

global.fetch = jest.fn();
global.AbortSignal = {
  timeout: jest.fn(() => new AbortController().signal)
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});