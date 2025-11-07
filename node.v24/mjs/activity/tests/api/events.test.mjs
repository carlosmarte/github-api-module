/**
 * Tests for Events API
 */

import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { EventsAPI } from '../../src/api/events.mjs';

describe('EventsAPI', () => {
  let eventsAPI;
  let mockHttp;

  beforeEach(() => {
    // Mock HTTP client
    mockHttp = {
      get: mock.fn(() => Promise.resolve({
        data: [
          { id: '1', type: 'PushEvent', actor: { login: 'user1' }, repo: { name: 'repo1' } },
          { id: '2', type: 'WatchEvent', actor: { login: 'user2' }, repo: { name: 'repo2' } }
        ],
        pagination: { next: 'url', next_page: 2 },
        rateLimit: { remaining: 100 }
      })),
      fetchAllPages: mock.fn(() => Promise.resolve([]))
    };
    
    eventsAPI = new EventsAPI(mockHttp);
  });

  describe('listPublic', () => {
    test('should fetch public events', async () => {
      const result = await eventsAPI.listPublic({ page: 1, per_page: 30 });
      
      assert.equal(mockHttp.get.mock.calls.length, 1);
      assert.deepEqual(mockHttp.get.mock.calls[0].arguments, ['/events', { page: 1, per_page: 30 }]);
      assert.equal(result.data.length, 2);
      assert.equal(result.data[0].type, 'PushEvent');
    });
  });

  describe('listForRepo', () => {
    test('should fetch repository events', async () => {
      const result = await eventsAPI.listForRepo('owner', 'repo', { page: 2 });
      
      assert.equal(mockHttp.get.mock.calls.length, 1);
      assert.deepEqual(mockHttp.get.mock.calls[0].arguments, [
        '/repos/owner/repo/events',
        { page: 2 }
      ]);
      assert.ok(result.data);
    });
  });

  describe('listForUser', () => {
    test('should fetch user events', async () => {
      const result = await eventsAPI.listForUser('username', { per_page: 50 });
      
      assert.equal(mockHttp.get.mock.calls.length, 1);
      assert.deepEqual(mockHttp.get.mock.calls[0].arguments, [
        '/users/username/events',
        { per_page: 50 }
      ]);
      assert.ok(result.data);
    });
  });

  describe('filterByType', () => {
    test('should filter events by single type', () => {
      const events = [
        { type: 'PushEvent', id: '1' },
        { type: 'WatchEvent', id: '2' },
        { type: 'PushEvent', id: '3' }
      ];
      
      const filtered = eventsAPI.filterByType(events, 'PushEvent');
      assert.equal(filtered.length, 2);
      assert.equal(filtered[0].id, '1');
      assert.equal(filtered[1].id, '3');
    });

    test('should filter events by multiple types', () => {
      const events = [
        { type: 'PushEvent', id: '1' },
        { type: 'WatchEvent', id: '2' },
        { type: 'ForkEvent', id: '3' }
      ];
      
      const filtered = eventsAPI.filterByType(events, ['PushEvent', 'ForkEvent']);
      assert.equal(filtered.length, 2);
    });
  });

  describe('filterByRepo', () => {
    test('should filter events by repository', () => {
      const events = [
        { repo: { name: 'owner/repo1' }, id: '1' },
        { repo: { name: 'owner/repo2' }, id: '2' },
        { repo: { name: 'owner/repo1' }, id: '3' }
      ];
      
      const filtered = eventsAPI.filterByRepo(events, 'owner/repo1');
      assert.equal(filtered.length, 2);
      assert.equal(filtered[0].id, '1');
      assert.equal(filtered[1].id, '3');
    });
  });

  describe('filterByActor', () => {
    test('should filter events by actor', () => {
      const events = [
        { actor: { login: 'user1' }, id: '1' },
        { actor: { login: 'user2' }, id: '2' },
        { actor: { login: 'user1' }, id: '3' }
      ];
      
      const filtered = eventsAPI.filterByActor(events, 'user1');
      assert.equal(filtered.length, 2);
      assert.equal(filtered[0].id, '1');
      assert.equal(filtered[1].id, '3');
    });
  });

  describe('groupByType', () => {
    test('should group events by type', () => {
      const events = [
        { type: 'PushEvent', id: '1' },
        { type: 'WatchEvent', id: '2' },
        { type: 'PushEvent', id: '3' }
      ];
      
      const grouped = eventsAPI.groupByType(events);
      assert.equal(Object.keys(grouped).length, 2);
      assert.equal(grouped.PushEvent.length, 2);
      assert.equal(grouped.WatchEvent.length, 1);
    });
  });

  describe('getStatistics', () => {
    test('should calculate event statistics', () => {
      const events = [
        { type: 'PushEvent', actor: { login: 'user1' }, repo: { name: 'repo1' }, public: true },
        { type: 'WatchEvent', actor: { login: 'user2' }, repo: { name: 'repo1' }, public: true },
        { type: 'PushEvent', actor: { login: 'user1' }, repo: { name: 'repo2' }, public: false }
      ];
      
      const stats = eventsAPI.getStatistics(events);
      
      assert.equal(stats.total, 3);
      assert.equal(stats.publicEvents, 2);
      assert.equal(stats.privateEvents, 1);
      assert.equal(stats.types.PushEvent, 2);
      assert.equal(stats.types.WatchEvent, 1);
      assert.equal(stats.actors.user1, 2);
      assert.equal(stats.actors.user2, 1);
      assert.equal(stats.repos.repo1, 2);
      assert.equal(stats.repos.repo2, 1);
    });
  });

  describe('getPaginator', () => {
    test('should create paginator for public events', () => {
      const paginator = eventsAPI.getPublicPaginator({ per_page: 50 });
      assert.ok(paginator);
      assert.equal(paginator.perPage, 50);
    });

    test('should create paginator for repo events', () => {
      const paginator = eventsAPI.getRepoPaginator('owner', 'repo', { page: 2 });
      assert.ok(paginator);
      assert.equal(paginator.currentPage, 2);
    });
  });
});