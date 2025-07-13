/**
 * @fileoverview Branch API endpoints
 * @module api/branches
 */

import { validateRepositoryName, validateUsername, validateBranchName, validatePagination } from '../utils/validation.mjs';

/**
 * List repository branches
 */
export async function list(httpClient, owner, repo, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validatePagination(options);
  
  const params = new URLSearchParams({
    protected: options.protected ? 'true' : 'false',
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/repos/${owner}/${repo}/branches?${params.toString()}`);
}

/**
 * Get a specific branch
 */
export async function get(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`);
}

/**
 * Get branch protection
 */
export async function getProtection(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`);
}

/**
 * Update branch protection
 */
export async function updateProtection(httpClient, owner, repo, branch, protection) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.put(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`,
    protection
  );
}

/**
 * Remove branch protection
 */
export async function removeProtection(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  await httpClient.delete(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`);
  return { message: 'Branch protection removed successfully' };
}

/**
 * Get required status checks
 */
export async function getRequiredStatusChecks(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks`
  );
}

/**
 * Update required status checks
 */
export async function updateRequiredStatusChecks(httpClient, owner, repo, branch, options) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.patch(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks`,
    options
  );
}

/**
 * Remove required status checks
 */
export async function removeRequiredStatusChecks(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks`
  );
  return { message: 'Required status checks removed successfully' };
}

/**
 * Get required status check contexts
 */
export async function getRequiredStatusCheckContexts(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks/contexts`
  );
}

/**
 * Add required status check contexts
 */
export async function addRequiredStatusCheckContexts(httpClient, owner, repo, branch, contexts) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(contexts)) {
    throw new Error('Contexts must be an array');
  }
  
  return await httpClient.post(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks/contexts`,
    contexts
  );
}

/**
 * Set required status check contexts
 */
export async function setRequiredStatusCheckContexts(httpClient, owner, repo, branch, contexts) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(contexts)) {
    throw new Error('Contexts must be an array');
  }
  
  return await httpClient.put(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks/contexts`,
    contexts
  );
}

/**
 * Remove required status check contexts
 */
export async function removeRequiredStatusCheckContexts(httpClient, owner, repo, branch, contexts) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(contexts)) {
    throw new Error('Contexts must be an array');
  }
  
  return await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks/contexts`,
    { body: contexts }
  );
}

/**
 * Get pull request review protection
 */
export async function getPullRequestReviewProtection(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_pull_request_reviews`
  );
}

/**
 * Update pull request review protection
 */
export async function updatePullRequestReviewProtection(httpClient, owner, repo, branch, options) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.patch(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_pull_request_reviews`,
    options
  );
}

/**
 * Remove pull request review protection
 */
export async function removePullRequestReviewProtection(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/required_pull_request_reviews`
  );
  return { message: 'Pull request review protection removed successfully' };
}

/**
 * Get admin enforcement
 */
export async function getAdminEnforcement(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/enforce_admins`
  );
}

/**
 * Add admin enforcement
 */
export async function addAdminEnforcement(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.post(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/enforce_admins`
  );
}

/**
 * Remove admin enforcement
 */
export async function removeAdminEnforcement(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/enforce_admins`
  );
  return { message: 'Admin enforcement removed successfully' };
}

/**
 * Get restrictions (who can push to branch)
 */
export async function getRestrictions(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions`
  );
}

/**
 * Remove restrictions
 */
export async function removeRestrictions(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions`
  );
  return { message: 'Push restrictions removed successfully' };
}

/**
 * Get user restrictions
 */
export async function getUserRestrictions(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/users`
  );
}

/**
 * Add user restrictions
 */
export async function addUserRestrictions(httpClient, owner, repo, branch, users) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }
  
  return await httpClient.post(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/users`,
    users
  );
}

/**
 * Set user restrictions
 */
export async function setUserRestrictions(httpClient, owner, repo, branch, users) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }
  
  return await httpClient.put(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/users`,
    users
  );
}

/**
 * Remove user restrictions
 */
export async function removeUserRestrictions(httpClient, owner, repo, branch, users) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }
  
  return await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/users`,
    { body: users }
  );
}

/**
 * Get team restrictions
 */
export async function getTeamRestrictions(httpClient, owner, repo, branch) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  return await httpClient.get(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/teams`
  );
}

/**
 * Add team restrictions
 */
export async function addTeamRestrictions(httpClient, owner, repo, branch, teams) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(teams)) {
    throw new Error('Teams must be an array');
  }
  
  return await httpClient.post(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/teams`,
    teams
  );
}

/**
 * Set team restrictions
 */
export async function setTeamRestrictions(httpClient, owner, repo, branch, teams) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(teams)) {
    throw new Error('Teams must be an array');
  }
  
  return await httpClient.put(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/teams`,
    teams
  );
}

/**
 * Remove team restrictions
 */
export async function removeTeamRestrictions(httpClient, owner, repo, branch, teams) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  
  if (!Array.isArray(teams)) {
    throw new Error('Teams must be an array');
  }
  
  return await httpClient.delete(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection/restrictions/teams`,
    { body: teams }
  );
}

/**
 * Rename a branch
 */
export async function rename(httpClient, owner, repo, branch, newName) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateBranchName(branch);
  validateBranchName(newName);
  
  return await httpClient.post(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/rename`, {
    new_name: newName
  });
}

/**
 * Merge a branch
 */
export async function merge(httpClient, owner, repo, options) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  const payload = {
    base: options.base,
    head: options.head,
    commit_message: options.commit_message || `Merge ${options.head} into ${options.base}`
  };
  
  return await httpClient.post(`/repos/${owner}/${repo}/merges`, payload);
}

/**
 * Compare two commits/branches
 */
export async function compare(httpClient, owner, repo, base, head) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  return await httpClient.get(`/repos/${owner}/${repo}/compare/${base}...${head}`);
}

/**
 * Create a branch protection rule template
 */
export function createProtectionTemplate(options = {}) {
  return {
    required_status_checks: options.requireStatusChecks ? {
      strict: options.strict !== false,
      contexts: options.contexts || []
    } : null,
    enforce_admins: options.enforceAdmins !== false,
    required_pull_request_reviews: options.requirePullRequestReviews ? {
      required_approving_review_count: options.requiredReviewers || 1,
      dismiss_stale_reviews: options.dismissStaleReviews !== false,
      require_code_owner_reviews: options.requireCodeOwnerReviews === true,
      require_last_push_approval: options.requireLastPushApproval === true,
      required_review_thread_resolution: options.requireReviewThreadResolution === true
    } : null,
    restrictions: options.restrictions ? {
      users: options.restrictedUsers || [],
      teams: options.restrictedTeams || [],
      apps: options.restrictedApps || []
    } : null,
    allow_force_pushes: options.allowForcePushes === true,
    allow_deletions: options.allowDeletions === true,
    block_creations: options.blockCreations === true,
    required_conversation_resolution: options.requireConversationResolution === true
  };
}