/**
 * @fileoverview Repository rules API endpoints
 * @module api/rules
 */

import { validateRepositoryName, validateUsername, validatePagination } from '../utils/validation.mjs';

export async function listRulesets(httpClient, owner, repo, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validatePagination(options);
  
  const params = new URLSearchParams({
    includes_parents: options.includes_parents === true ? 'true' : 'false',
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/repos/${owner}/${repo}/rulesets?${params.toString()}`);
}

export async function getRuleset(httpClient, owner, repo, rulesetId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.get(`/repos/${owner}/${repo}/rulesets/${rulesetId}`);
}

export async function createRuleset(httpClient, owner, repo, rulesetData) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.post(`/repos/${owner}/${repo}/rulesets`, rulesetData);
}

export async function updateRuleset(httpClient, owner, repo, rulesetId, updates) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.put(`/repos/${owner}/${repo}/rulesets/${rulesetId}`, updates);
}

export async function deleteRuleset(httpClient, owner, repo, rulesetId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  await httpClient.delete(`/repos/${owner}/${repo}/rulesets/${rulesetId}`);
  return { message: 'Ruleset deleted successfully' };
}