/**
 * @fileoverview Collaborators API endpoints
 * @module api/collaborators
 */

import { validateRepositoryName, validateUsername, validatePagination } from '../utils/validation.mjs';
import { ValidationError } from '../utils/errors.mjs';

/**
 * List repository collaborators
 */
export async function list(httpClient, owner, repo, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validatePagination(options);
  
  const params = new URLSearchParams({
    affiliation: options.affiliation || 'all', // all, direct, outside
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/repos/${owner}/${repo}/collaborators?${params.toString()}`);
}

/**
 * Check if user is a collaborator
 */
export async function checkPermissions(httpClient, owner, repo, username) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateUsername(username);
  
  try {
    return await httpClient.get(`/repos/${owner}/${repo}/collaborators/${username}/permission`);
  } catch (error) {
    if (error.statusCode === 404) {
      return { permission: 'none', user: { login: username } };
    }
    throw error;
  }
}

/**
 * Add repository collaborator
 */
export async function add(httpClient, owner, repo, username, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateUsername(username);
  
  const validPermissions = ['pull', 'push', 'admin', 'maintain', 'triage'];
  const permission = options.permission || 'push';
  
  if (!validPermissions.includes(permission)) {
    throw new ValidationError(
      `Permission must be one of: ${validPermissions.join(', ')}`,
      'permission',
      permission
    );
  }
  
  const payload = { permission };
  
  return await httpClient.put(`/repos/${owner}/${repo}/collaborators/${username}`, payload);
}

/**
 * Remove repository collaborator
 */
export async function remove(httpClient, owner, repo, username) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validateUsername(username);
  
  await httpClient.delete(`/repos/${owner}/${repo}/collaborators/${username}`);
  return { message: `Collaborator ${username} removed successfully` };
}

/**
 * List repository invitations
 */
export async function listInvitations(httpClient, owner, repo, options = {}) {
  validateUsername(owner);
  validateRepositoryName(repo);
  validatePagination(options);
  
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/repos/${owner}/${repo}/invitations?${params.toString()}`);
}

/**
 * Update repository invitation
 */
export async function updateInvitation(httpClient, owner, repo, invitationId, permission) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  const validPermissions = ['read', 'write', 'admin'];
  if (!validPermissions.includes(permission)) {
    throw new ValidationError(
      `Permission must be one of: ${validPermissions.join(', ')}`,
      'permission',
      permission
    );
  }
  
  return await httpClient.patch(`/repos/${owner}/${repo}/invitations/${invitationId}`, {
    permissions: permission
  });
}

/**
 * Delete repository invitation
 */
export async function deleteInvitation(httpClient, owner, repo, invitationId) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  await httpClient.delete(`/repos/${owner}/${repo}/invitations/${invitationId}`);
  return { message: 'Invitation deleted successfully' };
}

/**
 * List user's repository invitations
 */
export async function listUserInvitations(httpClient, options = {}) {
  validatePagination(options);
  
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: Math.min(options.per_page || 30, 100)
  });
  
  return await httpClient.get(`/user/repository_invitations?${params.toString()}`);
}

/**
 * Accept repository invitation
 */
export async function acceptInvitation(httpClient, invitationId) {
  return await httpClient.patch(`/user/repository_invitations/${invitationId}`);
}

/**
 * Decline repository invitation
 */
export async function declineInvitation(httpClient, invitationId) {
  await httpClient.delete(`/user/repository_invitations/${invitationId}`);
  return { message: 'Invitation declined successfully' };
}

/**
 * Get permission level for user
 */
export async function getPermissionLevel(httpClient, owner, repo, username) {
  const permissionData = await checkPermissions(httpClient, owner, repo, username);
  return permissionData.permission;
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(httpClient, owner, repo, username, requiredPermission) {
  const permission = await getPermissionLevel(httpClient, owner, repo, username);
  
  const permissionHierarchy = {
    'none': 0,
    'read': 1,
    'triage': 2,
    'write': 3,
    'maintain': 4,
    'admin': 5
  };
  
  const userLevel = permissionHierarchy[permission] || 0;
  const requiredLevel = permissionHierarchy[requiredPermission] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Bulk add collaborators
 */
export async function bulkAdd(httpClient, owner, repo, collaborators) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  if (!Array.isArray(collaborators)) {
    throw new ValidationError('Collaborators must be an array', 'collaborators', collaborators);
  }
  
  const results = [];
  
  for (const collaborator of collaborators) {
    try {
      const result = await add(httpClient, owner, repo, collaborator.username, {
        permission: collaborator.permission || 'push'
      });
      results.push({
        username: collaborator.username,
        success: true,
        result
      });
    } catch (error) {
      results.push({
        username: collaborator.username,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Get collaborator statistics
 */
export async function getStats(httpClient, owner, repo) {
  validateUsername(owner);
  validateRepositoryName(repo);
  
  const collaborators = await list(httpClient, owner, repo, { per_page: 100 });
  
  const stats = {
    total: collaborators.length,
    byPermission: {},
    byType: {
      users: 0,
      bots: 0
    }
  };
  
  for (const collaborator of collaborators) {
    // Count by permission
    const permission = collaborator.permissions || {};
    let level = 'read';
    if (permission.admin) level = 'admin';
    else if (permission.maintain) level = 'maintain';
    else if (permission.push) level = 'write';
    else if (permission.triage) level = 'triage';
    
    stats.byPermission[level] = (stats.byPermission[level] || 0) + 1;
    
    // Count by type
    if (collaborator.type === 'Bot') {
      stats.byType.bots++;
    } else {
      stats.byType.users++;
    }
  }
  
  return stats;
}

/**
 * Create collaborator permission template
 */
export function createPermissionTemplate(level) {
  const templates = {
    read: {
      permission: 'pull',
      description: 'Can read and clone repository'
    },
    triage: {
      permission: 'triage',
      description: 'Can read, clone, and manage issues and pull requests'
    },
    write: {
      permission: 'push',
      description: 'Can read, clone, and push to repository'
    },
    maintain: {
      permission: 'maintain',
      description: 'Can read, clone, push, and manage repository settings'
    },
    admin: {
      permission: 'admin',
      description: 'Full access to repository including settings and collaborators'
    }
  };
  
  return templates[level] || templates.write;
}