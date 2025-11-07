/**
 * TypeScript definitions for @github-api/users
 */

// Main client and configuration types
export interface ClientOptions {
  token: string;
  baseUrl?: string;
  timeout?: number;
  rateLimiting?: {
    enabled?: boolean;
    maxRequests?: number;
    window?: number;
  };
  headers?: Record<string, string>;
}

// User data types
export interface SimpleUser {
  id: number;
  login: string;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: 'User' | 'Organization';
  site_admin: boolean;
  starred_at?: string;
  user_view_type?: string;
}

export interface PublicUser extends SimpleUser {
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface PrivateUser extends PublicUser {
  private_gists: number;
  total_private_repos: number;
  owned_private_repos: number;
  disk_usage: number;
  collaborators: number;
  two_factor_authentication: boolean;
  plan?: {
    name: string;
    space: number;
    private_repos: number;
    collaborators: number;
  };
}

// Email types
export interface Email {
  email: string;
  verified: boolean;
  primary: boolean;
  visibility: 'public' | 'private' | null;
}

export interface EmailStats {
  total: number;
  verified: number;
  unverified: number;
  primary: number;
  public: number;
  private: number;
}

// Context/Hovercard types
export interface UserContext {
  contexts: Array<{
    message: string;
    octicon?: string;
  }>;
}

export interface UserContextSummary {
  username: string;
  hasContext: boolean;
  messageCount: number;
  messages: string[];
  subjectType: string | null;
  subjectId: string | null;
}

// Update types
export interface UserUpdateData {
  name?: string | null;
  email?: string | null;
  blog?: string | null;
  company?: string | null;
  location?: string | null;
  hireable?: boolean | null;
  bio?: string | null;
  twitter_username?: string | null;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  per_page?: number;
  since?: number;
}

export interface PaginationInfo {
  hasNext: boolean;
  hasPrev: boolean;
  nextUrl: string | null;
  prevUrl: string | null;
  firstUrl: string | null;
  lastUrl: string | null;
  totalCount: number | null;
}

// Search types
export interface UserSearchCriteria {
  type?: 'User' | 'Organization';
  minId?: number;
  maxId?: number;
}

export interface UserStats {
  username: string;
  name: string | null;
  id: number;
  type: string;
  siteAdmin: boolean;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  accountAge: number | null;
  lastActivity: string | null;
  hasCompany: boolean;
  hasLocation: boolean;
  hasBlog: boolean;
  hasBio: boolean;
  hireable: boolean | null;
}

// Bulk operation results
export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    email: string;
    error: string;
  }>;
}

export interface MultiUserResult<T> {
  successful: T[];
  failed: Array<{
    username: string;
    error: string;
  }>;
}

// API Classes
export declare class ProfileAPI {
  constructor(http: any);
  getAuthenticated(options?: any): Promise<PrivateUser>;
  updateAuthenticated(userData: UserUpdateData, options?: any): Promise<PrivateUser>;
  getPublicProfile(options?: any): Promise<PublicUser>;
  getDiskUsage(options?: any): Promise<{
    diskUsage: number;
    privateRepos: number;
    totalPrivateRepos: number;
    collaborators: number;
  }>;
  getPlan(options?: any): Promise<any>;
  checkPermissions(scopes?: string[]): Promise<any>;
}

export declare class EmailsAPI {
  constructor(http: any);
  list(options?: PaginationOptions): Promise<Email[]>;
  add(emails: string | string[], options?: any): Promise<Email[]>;
  delete(emails: string | string[], options?: any): Promise<void>;
  getPrimary(options?: any): Promise<Email | null>;
  getVerified(options?: any): Promise<Email[]>;
  getUnverified(options?: any): Promise<Email[]>;
  exists(email: string, options?: any): Promise<boolean>;
  getStats(options?: any): Promise<EmailStats>;
  bulkAdd(emails: string[], options?: any): Promise<BulkOperationResult<Email>>;
  bulkDelete(emails: string[], options?: any): Promise<BulkOperationResult<string>>;
}

export declare class DiscoveryAPI {
  constructor(http: any);
  list(options?: PaginationOptions): Promise<SimpleUser[]>;
  getByUsername(username: string, options?: any): Promise<PublicUser>;
  getById(accountId: number, options?: any): Promise<PublicUser>;
  search(criteria?: UserSearchCriteria, options?: PaginationOptions): Promise<SimpleUser[]>;
  exists(username: string, options?: any): Promise<boolean>;
  getStats(username: string, options?: any): Promise<UserStats>;
  getMultipleByUsername(usernames: string[], options?: any): Promise<MultiUserResult<PublicUser>>;
}

export declare class ContextAPI {
  constructor(http: any);
  getForUser(username: string, options?: {
    subject_type?: 'repository' | 'issue' | 'pull_request' | 'organization';
    subject_id?: string;
  }): Promise<UserContext>;
  getForUserInRepository(username: string, repositoryId: string | number, options?: any): Promise<UserContext>;
  getForUserInOrganization(username: string, organizationId: string, options?: any): Promise<UserContext>;
  getForUserInIssue(username: string, issueId: string | number, options?: any): Promise<UserContext>;
  getForUserInPullRequest(username: string, pullRequestId: string | number, options?: any): Promise<UserContext>;
  getSummary(username: string, options?: any): Promise<UserContextSummary>;
  getForMultipleUsers(usernames: string[], options?: any): Promise<MultiUserResult<UserContext>>;
}

// Main client class
export declare class UsersClient {
  profile: ProfileAPI;
  emails: EmailsAPI;
  discovery: DiscoveryAPI;
  context: ContextAPI;

  constructor(options: ClientOptions);
  testAuth(): Promise<any>;
  getRateLimit(): Promise<any>;
  updateConfig(options: Partial<ClientOptions>): void;
  close(): void;
}

// Factory function
export declare function createClient(options: ClientOptions): UsersClient;

// Convenience functions
export declare function getAuthenticatedUser(options: ClientOptions): Promise<PrivateUser>;
export declare function getUser(username: string, options: ClientOptions): Promise<PublicUser>;
export declare function listUsers(options: ClientOptions & PaginationOptions): Promise<SimpleUser[]>;
export declare function listEmails(options: ClientOptions): Promise<Email[]>;

// Error classes
export declare class UsersError extends Error {
  status?: number;
  response?: any;
  constructor(message: string, status?: number, response?: any);
  toJSON(): object;
}

export declare class AuthError extends UsersError {
  constructor(message: string, status?: number, response?: any);
}

export declare class ValidationError extends UsersError {
  errors: any[];
  constructor(message: string, status?: number, response?: any);
  getValidationErrors(): any[];
  getFieldErrors(field: string): any[];
}

export declare class RateLimitError extends UsersError {
  resetTime: Date | null;
  limit: number | null;
  remaining: number;
  constructor(message: string, status?: number, response?: any);
  getTimeUntilReset(): number;
  getTimeUntilResetString(): string;
}

export declare class NotFoundError extends UsersError {
  constructor(message: string, status?: number, response?: any);
}

export declare class ForbiddenError extends UsersError {
  constructor(message: string, status?: number, response?: any);
}

export declare class NetworkError extends UsersError {
  originalError: Error | null;
  constructor(message: string, originalError?: Error);
}

// Utility functions
export declare function validateEmail(email: string): boolean;
export declare function validateUsername(username: string): boolean;
export declare function validateUserId(userId: number | string): boolean;

export declare function paginate<T>(apiCall: Function, options?: PaginationOptions): AsyncIterableIterator<T>;
export declare function paginateAll<T>(apiCall: Function, options?: PaginationOptions & { maxRequests?: number }): Promise<T[]>;
export declare function autoPaginate<T>(apiCall: Function, options?: PaginationOptions & { maxRequests?: number }): AsyncIterableIterator<T>;

// Package info
export declare const packageInfo: {
  name: string;
  version: string;
  description: string;
  homepage: string;
};

// Default export
declare const _default: typeof UsersClient;
export default _default;