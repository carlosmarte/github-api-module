/**
 * @fileoverview Webhooks API endpoints  
 * @module api/webhooks
 */

import { validateRepositoryName, validateUsername, validateWebhookConfig, validatePagination } from '../utils/validation.mjs';

export async function list(httpClient, owner, repo, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validatePagination(options);
  
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/repos/${owner}/${repo}/hooks?${params.toString()}`);
}

export async function get(httpClient, owner, repo, hookId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.get(`/repos/${owner}/${repo}/hooks/${hookId}`);
}

export async function create(httpClient, owner, repo, webhookData) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateWebhookConfig(webhookData.config);
  
  const payload = {
    name: webhookData.name || 'web',
    config: webhookData.config,
    events: webhookData.events || ['push'],
    active: webhookData.active !== false
  };
  
  return await httpClient.post(`/repos/${owner}/${repo}/hooks`, payload);
}

export async function update(httpClient, owner, repo, hookId, updates) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  if (updates.config) {
    validateWebhookConfig(updates.config);
  }
  
  return await httpClient.patch(`/repos/${owner}/${repo}/hooks/${hookId}`, updates);
}

export async function deleteHook(httpClient, owner, repo, hookId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  await httpClient.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
  return { message: 'Webhook deleted successfully' };
}

export async function test(httpClient, owner, repo, hookId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.post(`/repos/${owner}/${repo}/hooks/${hookId}/tests`);
}

export async function ping(httpClient, owner, repo, hookId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.post(`/repos/${owner}/${repo}/hooks/${hookId}/pings`);
}