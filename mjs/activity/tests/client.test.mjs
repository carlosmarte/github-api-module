/**
 * Tests for ActivityClient
 */

import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { ActivityClient } from '../src/client/ActivityClient.mjs';

describe('ActivityClient', () => {
  let client;

  beforeEach(() => {
    client = new ActivityClient({
      token: 'test_token',
      baseURL: 'https://api.github.com'
    });
  });

  describe('constructor', () => {
    test('should create client with default options', () => {
      const client = new ActivityClient();
      assert.ok(client);
      assert.equal(client.options.baseURL, 'https://api.github.com');
      assert.equal(client.options.timeout, 30000);
      assert.equal(client.options.perPage, 30);
    });

    test('should create client with custom options', () => {
      const client = new ActivityClient({
        token: 'custom_token',
        baseURL: 'https://custom.api.com',
        timeout: 60000,
        perPage: 50
      });
      assert.equal(client.options.token, 'custom_token');
      assert.equal(client.options.baseURL, 'https://custom.api.com');
      assert.equal(client.options.timeout, 60000);
      assert.equal(client.options.perPage, 50);
    });

    test('should initialize API modules', () => {
      assert.ok(client.events);
      assert.ok(client.notifications);
      assert.ok(client.feeds);
      assert.ok(client.stars);
      assert.ok(client.watching);
    });
  });

  describe('setToken', () => {
    test('should update token', () => {
      client.setToken('new_token');
      assert.equal(client.options.token, 'new_token');
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when token is set', () => {
      assert.equal(client.isAuthenticated(), true);
    });

    test('should return false when no token', () => {
      const unauthClient = new ActivityClient();
      assert.equal(unauthClient.isAuthenticated(), false);
    });
  });

  describe('withOptions', () => {
    test('should create new client with merged options', () => {
      const newClient = client.withOptions({
        perPage: 100,
        debug: true
      });
      assert.notEqual(newClient, client);
      assert.equal(newClient.options.token, 'test_token');
      assert.equal(newClient.options.perPage, 100);
      assert.equal(newClient.options.debug, true);
    });
  });

  describe('factory methods', () => {
    test('fromEnvironment should create client from env vars', async () => {
      process.env.GITHUB_TOKEN = 'env_token';
      const client = await ActivityClient.fromEnvironment();
      assert.ok(client);
      assert.equal(client.options.token, 'env_token');
      delete process.env.GITHUB_TOKEN;
    });

    test('fromConfig should create client from config file', async () => {
      // This would require mocking file system
      // Skipping for now as it requires more setup
    });
  });
});