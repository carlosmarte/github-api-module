/**
 * @fileoverview Security API endpoints
 * @module api/security
 */

import { validateRepositoryName, validateUsername } from '../utils/validation.mjs';

export async function getSecurityAnalysis(httpClient, owner, repo) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.get(`/repos/${owner}/${repo}/security-analysis`);
}

export async function updateSecurityAnalysis(httpClient, owner, repo, settings) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.patch(`/repos/${owner}/${repo}/security-analysis`, settings);
}

export async function getVulnerabilityAlerts(httpClient, owner, repo) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  try {
    await httpClient.get(`/repos/${owner}/${repo}/vulnerability-alerts`);
    return { enabled: true };
  } catch (error) {
    if (error.statusCode === 404) {
      return { enabled: false };
    }
    throw error;
  }
}

export async function enableVulnerabilityAlerts(httpClient, owner, repo) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.put(`/repos/${owner}/${repo}/vulnerability-alerts`);
}

export async function disableVulnerabilityAlerts(httpClient, owner, repo) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  await httpClient.delete(`/repos/${owner}/${repo}/vulnerability-alerts`);
  return { message: 'Vulnerability alerts disabled' };
}