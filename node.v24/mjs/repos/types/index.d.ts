/**
 * TypeScript definitions for @github-api/repos
 * GitHub Repository API client and CLI
 */

declare module '@github-api/repos' {
  // ============================================================================
  // Core Types
  // ============================================================================

  export interface RepoClientOptions {
    /** GitHub personal access token */
    token?: string;
    /** GitHub API base URL */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Rate limiting configuration */
    rateLimiting?: {
      enabled?: boolean;
      padding?: number;
    };
    /** Authentication configuration */
    auth?: AuthConfig;
    /** User agent string */
    userAgent?: string;
    /** Enable verbose logging */
    verbose?: boolean;
  }

  export interface AuthConfig {
    token?: string;
    authType?: 'token' | 'github_app' | 'oauth';
    appId?: string;
    privateKey?: string;
    installationId?: string;
  }

  // ============================================================================
  // GitHub API Types (based on OpenAPI schema)
  // ============================================================================

  export interface SimpleUser {
    name?: string | null;
    email?: string | null;
    login: string;
    id: number;
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
    type: string;
    site_admin: boolean;
    starred_at?: string;
    user_view_type?: string;
  }

  export interface Repository {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    owner: SimpleUser;
    private: boolean;
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    archive_url: string;
    assignees_url: string;
    blobs_url: string;
    branches_url: string;
    collaborators_url: string;
    comments_url: string;
    commits_url: string;
    compare_url: string;
    contents_url: string;
    contributors_url: string;
    deployments_url: string;
    downloads_url: string;
    events_url: string;
    forks_url: string;
    git_commits_url: string;
    git_refs_url: string;
    git_tags_url: string;
    git_url: string;
    issue_comment_url: string;
    issue_events_url: string;
    issues_url: string;
    keys_url: string;
    labels_url: string;
    languages_url: string;
    merges_url: string;
    milestones_url: string;
    notifications_url: string;
    pulls_url: string;
    releases_url: string;
    ssh_url: string;
    stargazers_url: string;
    statuses_url: string;
    subscribers_url: string;
    subscription_url: string;
    tags_url: string;
    teams_url: string;
    trees_url: string;
    clone_url: string;
    mirror_url: string | null;
    hooks_url: string;
    svn_url: string;
    homepage: string | null;
    language: string | null;
    forks_count: number;
    stargazers_count: number;
    watchers_count: number;
    size: number;
    default_branch: string;
    open_issues_count: number;
    is_template?: boolean;
    topics?: string[];
    has_issues: boolean;
    has_projects: boolean;
    has_wiki: boolean;
    has_pages?: boolean;
    has_downloads?: boolean;
    has_discussions?: boolean;
    archived: boolean;
    disabled: boolean;
    visibility?: string;
    pushed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    permissions?: {
      admin: boolean;
      maintain?: boolean;
      push: boolean;
      triage?: boolean;
      pull: boolean;
    };
    allow_rebase_merge?: boolean;
    temp_clone_token?: string;
    allow_squash_merge?: boolean;
    allow_auto_merge?: boolean;
    delete_branch_on_merge?: boolean;
    allow_update_branch?: boolean;
    use_squash_pr_title_as_default?: boolean;
    squash_merge_commit_title?: 'PR_TITLE' | 'COMMIT_OR_PR_TITLE';
    squash_merge_commit_message?: 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK';
    merge_commit_title?: 'PR_TITLE' | 'MERGE_MESSAGE';
    merge_commit_message?: 'PR_BODY' | 'PR_TITLE' | 'BLANK';
    allow_merge_commit?: boolean;
    allow_forking?: boolean;
    web_commit_signoff_required?: boolean;
    subscribers_count?: number;
    network_count?: number;
    license: License | null;
    forks: number;
    open_issues: number;
    watchers: number;
    master_branch?: string;
    starred_at?: string;
    anonymous_access_enabled?: boolean;
  }

  export interface License {
    key: string;
    name: string;
    url: string | null;
    spdx_id: string | null;
    node_id: string;
    html_url?: string;
  }

  export interface Branch {
    name: string;
    protected: boolean;
    commit: {
      sha: string;
      url: string;
      commit: {
        message: string;
        author?: {
          name: string;
          email: string;
          date: string;
        };
        committer?: {
          name: string;
          email: string;
          date: string;
        };
      };
    };
    protection_url?: string;
  }

  export interface BranchProtection {
    required_status_checks: {
      strict: boolean;
      contexts: string[];
    } | null;
    enforce_admins: boolean;
    required_pull_request_reviews: {
      required_approving_review_count: number;
      dismiss_stale_reviews: boolean;
      require_code_owner_reviews: boolean;
      require_last_push_approval?: boolean;
      required_review_thread_resolution?: boolean;
    } | null;
    restrictions: {
      users: SimpleUser[];
      teams: Team[];
      apps: GitHubApp[];
    } | null;
    allow_force_pushes?: boolean;
    allow_deletions?: boolean;
    block_creations?: boolean;
    required_conversation_resolution?: boolean;
  }

  export interface Team {
    id: number;
    node_id: string;
    name: string;
    slug: string;
    description: string | null;
    privacy?: string;
    notification_setting?: string;
    permission: string;
    permissions?: {
      pull: boolean;
      triage: boolean;
      push: boolean;
      maintain: boolean;
      admin: boolean;
    };
    url: string;
    html_url: string;
    members_url: string;
    repositories_url: string;
    parent?: Team | null;
  }

  export interface GitHubApp {
    id: number;
    slug?: string;
    node_id: string;
    client_id?: string;
    owner: SimpleUser;
    name: string;
    description: string | null;
    external_url: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    permissions: Record<string, string>;
    events: string[];
    installations_count?: number;
  }

  export interface Collaborator extends SimpleUser {
    permissions?: {
      admin: boolean;
      maintain?: boolean;
      push: boolean;
      triage?: boolean;
      pull: boolean;
    };
  }

  export interface Tag {
    name: string;
    zipball_url: string;
    tarball_url: string;
    commit: {
      sha: string;
      url: string;
    };
    node_id: string;
  }

  export interface Webhook {
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: {
      url: string;
      content_type?: string;
      secret?: string;
      insecure_ssl?: string | number;
    };
    updated_at: string;
    created_at: string;
    url: string;
    test_url: string;
    ping_url: string;
    last_response?: {
      code: number | null;
      status: string;
      message: string | null;
    };
  }

  // ============================================================================
  // Request/Response Types
  // ============================================================================

  export interface ListRepositoriesOptions {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
  }

  export interface CreateRepositoryData {
    name: string;
    description?: string;
    homepage?: string;
    private?: boolean;
    visibility?: 'public' | 'private' | 'internal';
    has_issues?: boolean;
    has_projects?: boolean;
    has_wiki?: boolean;
    has_discussions?: boolean;
    is_template?: boolean;
    team_id?: number;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
    allow_squash_merge?: boolean;
    allow_merge_commit?: boolean;
    allow_rebase_merge?: boolean;
    allow_auto_merge?: boolean;
    delete_branch_on_merge?: boolean;
    allow_update_branch?: boolean;
    squash_merge_commit_title?: 'PR_TITLE' | 'COMMIT_OR_PR_TITLE';
    squash_merge_commit_message?: 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK';
    merge_commit_title?: 'PR_TITLE' | 'MERGE_MESSAGE';
    merge_commit_message?: 'PR_BODY' | 'PR_TITLE' | 'BLANK';
    topics?: string[];
  }

  export interface UpdateRepositoryData {
    name?: string;
    description?: string;
    homepage?: string;
    private?: boolean;
    visibility?: 'public' | 'private' | 'internal';
    has_issues?: boolean;
    has_projects?: boolean;
    has_wiki?: boolean;
    has_discussions?: boolean;
    is_template?: boolean;
    default_branch?: string;
    allow_squash_merge?: boolean;
    allow_merge_commit?: boolean;
    allow_rebase_merge?: boolean;
    allow_auto_merge?: boolean;
    delete_branch_on_merge?: boolean;
    allow_update_branch?: boolean;
    archived?: boolean;
    topics?: string[];
  }

  export interface ListBranchesOptions {
    protected?: boolean;
    page?: number;
    per_page?: number;
  }

  export interface ListCollaboratorsOptions {
    affiliation?: 'all' | 'direct' | 'outside';
    page?: number;
    per_page?: number;
  }

  export interface AddCollaboratorOptions {
    permission?: 'pull' | 'push' | 'admin' | 'maintain' | 'triage';
  }

  export interface CreateWebhookData {
    name?: string;
    config: {
      url: string;
      content_type?: 'json' | 'form';
      secret?: string;
      insecure_ssl?: '0' | '1' | 0 | 1;
    };
    events?: string[];
    active?: boolean;
  }

  export interface ForkOptions {
    organization?: string;
    name?: string;
    default_branch_only?: boolean;
  }

  export interface PaginationOptions {
    page?: number;
    per_page?: number;
  }

  // ============================================================================
  // Error Types
  // ============================================================================

  export class RepoError extends Error {
    name: 'RepoError';
    statusCode: number | null;
    response: any;
    constructor(message: string, statusCode?: number, response?: any);
    static fromResponse(response: any, body: any): RepoError;
  }

  export class AuthError extends RepoError {
    name: 'AuthError';
    constructor(message: string, statusCode?: number, response?: any);
  }

  export class ValidationError extends RepoError {
    name: 'ValidationError';
    field: string | null;
    value: any;
    constructor(message: string, field?: string, value?: any);
  }

  export class RateLimitError extends RepoError {
    name: 'RateLimitError';
    resetTime: number | null;
    remaining: number | null;
    constructor(message: string, resetTime?: number, remaining?: number);
  }

  export class NetworkError extends RepoError {
    name: 'NetworkError';
    originalError: Error | null;
    constructor(message: string, originalError?: Error);
  }

  export class NotFoundError extends RepoError {
    name: 'NotFoundError';
    resource: string;
    identifier: string | null;
    constructor(resource: string, identifier?: string);
  }

  export class ForbiddenError extends RepoError {
    name: 'ForbiddenError';
    constructor(message?: string);
  }

  export class ConflictError extends RepoError {
    name: 'ConflictError';
    resource: string | null;
    constructor(message: string, resource?: string);
  }

  export class GitHubAPIError extends RepoError {
    name: 'GitHubAPIError';
    errors: any[];
    documentation_url?: string;
    constructor(message: string, statusCode: number, response: any, errors?: any[]);
    static fromGitHubResponse(response: any, body: any): GitHubAPIError;
    isRateLimit(): boolean;
    isForbidden(): boolean;
    isNotFound(): boolean;
  }

  // ============================================================================
  // API Interface Types
  // ============================================================================

  export interface RepositoriesAPI {
    get(owner: string, repo: string): Promise<Repository>;
    listForUser(username: string, options?: ListRepositoriesOptions): Promise<Repository[]>;
    listForAuthenticatedUser(options?: ListRepositoriesOptions): Promise<Repository[]>;
    listForOrg(org: string, options?: ListRepositoriesOptions): Promise<Repository[]>;
    create(repoData: CreateRepositoryData): Promise<Repository>;
    createInOrg(org: string, repoData: CreateRepositoryData): Promise<Repository>;
    update(owner: string, repo: string, updates: UpdateRepositoryData): Promise<Repository>;
    delete(owner: string, repo: string): Promise<{ message: string }>;
    getAllTopics(owner: string, repo: string): Promise<{ names: string[] }>;
    replaceAllTopics(owner: string, repo: string, topics: string[]): Promise<{ names: string[] }>;
    getLanguages(owner: string, repo: string): Promise<Record<string, number>>;
    getContributors(owner: string, repo: string, options?: PaginationOptions): Promise<any[]>;
    getStats(owner: string, repo: string): Promise<any>;
    fork(owner: string, repo: string, options?: ForkOptions): Promise<Repository>;
    listForks(owner: string, repo: string, options?: PaginationOptions): Promise<Repository[]>;
    transfer(owner: string, repo: string, newOwner: string, teamIds?: number[]): Promise<Repository>;
    checkIfStarred(owner: string, repo: string): Promise<boolean>;
    star(owner: string, repo: string): Promise<{ message: string }>;
    unstar(owner: string, repo: string): Promise<{ message: string }>;
    checkIfWatched(owner: string, repo: string): Promise<boolean>;
    watch(owner: string, repo: string, subscribed?: boolean, ignored?: boolean): Promise<any>;
    unwatch(owner: string, repo: string): Promise<{ message: string }>;
    generateNameSuggestions(baseName: string): string[];
  }

  export interface BranchesAPI {
    list(owner: string, repo: string, options?: ListBranchesOptions): Promise<Branch[]>;
    get(owner: string, repo: string, branch: string): Promise<Branch>;
    getProtection(owner: string, repo: string, branch: string): Promise<BranchProtection>;
    updateProtection(owner: string, repo: string, branch: string, protection: Partial<BranchProtection>): Promise<BranchProtection>;
    removeProtection(owner: string, repo: string, branch: string): Promise<{ message: string }>;
    getRequiredStatusChecks(owner: string, repo: string, branch: string): Promise<any>;
    updateRequiredStatusChecks(owner: string, repo: string, branch: string, options: any): Promise<any>;
    removeRequiredStatusChecks(owner: string, repo: string, branch: string): Promise<{ message: string }>;
    // ... other branch protection methods
  }

  export interface CollaboratorsAPI {
    list(owner: string, repo: string, options?: ListCollaboratorsOptions): Promise<Collaborator[]>;
    checkPermissions(owner: string, repo: string, username: string): Promise<{ permission: string; user: SimpleUser }>;
    add(owner: string, repo: string, username: string, options?: AddCollaboratorOptions): Promise<any>;
    remove(owner: string, repo: string, username: string): Promise<{ message: string }>;
    listInvitations(owner: string, repo: string, options?: PaginationOptions): Promise<any[]>;
    updateInvitation(owner: string, repo: string, invitationId: number, permission: string): Promise<any>;
    deleteInvitation(owner: string, repo: string, invitationId: number): Promise<{ message: string }>;
    listUserInvitations(options?: PaginationOptions): Promise<any[]>;
    acceptInvitation(invitationId: number): Promise<any>;
    declineInvitation(invitationId: number): Promise<{ message: string }>;
    getPermissionLevel(owner: string, repo: string, username: string): Promise<string>;
    hasPermission(owner: string, repo: string, username: string, requiredPermission: string): Promise<boolean>;
    bulkAdd(owner: string, repo: string, collaborators: Array<{ username: string; permission?: string }>): Promise<any[]>;
    getStats(owner: string, repo: string): Promise<any>;
  }

  export interface TagsAPI {
    list(owner: string, repo: string, options?: PaginationOptions): Promise<Tag[]>;
    get(owner: string, repo: string, tag: string): Promise<any>;
    create(owner: string, repo: string, tagData: any): Promise<any>;
    createRef(owner: string, repo: string, tag: string, sha: string): Promise<any>;
    delete(owner: string, repo: string, tag: string): Promise<{ message: string }>;
    getProtection(owner: string, repo: string): Promise<any[]>;
    createProtection(owner: string, repo: string, pattern: string): Promise<any>;
    deleteProtection(owner: string, repo: string, tagProtectionId: number): Promise<{ message: string }>;
    listReleases(owner: string, repo: string, options?: PaginationOptions): Promise<any[]>;
    getReleaseByTag(owner: string, repo: string, tag: string): Promise<any>;
    createRelease(owner: string, repo: string, releaseData: any): Promise<any>;
    compare(owner: string, repo: string, base: string, head: string): Promise<any>;
    getCommit(owner: string, repo: string, tag: string): Promise<any>;
    getLatest(owner: string, repo: string): Promise<Tag | null>;
    exists(owner: string, repo: string, tag: string): Promise<boolean>;
    getAllTags(owner: string, repo: string): Promise<Tag[]>;
    createSemanticTag(owner: string, repo: string, version: string, sha: string, options?: any): Promise<any>;
    getNextSemanticVersion(currentVersion: string, increment?: 'major' | 'minor' | 'patch'): string;
    sortTagsBySemanticVersion(tags: Tag[], descending?: boolean): Tag[];
  }

  export interface WebhooksAPI {
    list(owner: string, repo: string, options?: PaginationOptions): Promise<Webhook[]>;
    get(owner: string, repo: string, hookId: number): Promise<Webhook>;
    create(owner: string, repo: string, webhookData: CreateWebhookData): Promise<Webhook>;
    update(owner: string, repo: string, hookId: number, updates: Partial<CreateWebhookData>): Promise<Webhook>;
    delete(owner: string, repo: string, hookId: number): Promise<{ message: string }>;
    test(owner: string, repo: string, hookId: number): Promise<any>;
    ping(owner: string, repo: string, hookId: number): Promise<any>;
  }

  export interface SecurityAPI {
    getSecurityAnalysis(owner: string, repo: string): Promise<any>;
    updateSecurityAnalysis(owner: string, repo: string, settings: any): Promise<any>;
    getVulnerabilityAlerts(owner: string, repo: string): Promise<{ enabled: boolean }>;
    enableVulnerabilityAlerts(owner: string, repo: string): Promise<any>;
    disableVulnerabilityAlerts(owner: string, repo: string): Promise<{ message: string }>;
  }

  export interface RulesAPI {
    listRulesets(owner: string, repo: string, options?: PaginationOptions & { includes_parents?: boolean }): Promise<any[]>;
    getRuleset(owner: string, repo: string, rulesetId: number): Promise<any>;
    createRuleset(owner: string, repo: string, rulesetData: any): Promise<any>;
    updateRuleset(owner: string, repo: string, rulesetId: number, updates: any): Promise<any>;
    deleteRuleset(owner: string, repo: string, rulesetId: number): Promise<{ message: string }>;
  }

  // ============================================================================
  // Main Client Class
  // ============================================================================

  export class RepoClient {
    repositories: RepositoriesAPI;
    branches: BranchesAPI;
    collaborators: CollaboratorsAPI;
    tags: TagsAPI;
    webhooks: WebhooksAPI;
    security: SecurityAPI;
    rules: RulesAPI;

    constructor(options: RepoClientOptions);
    
    initialize(): Promise<void>;
    getAuthenticatedUser(): Promise<SimpleUser>;
    getRateLimit(): Promise<any>;
    ping(): Promise<{ success: boolean; message: string; rateLimit?: any; error?: string }>;
    getConfig(): any;
    updateConfig(updates: Partial<RepoClientOptions>): void;
    
    paginate<T>(method: (...args: any[]) => Promise<T[]>, ...args: any[]): {
      [Symbol.asyncIterator](): AsyncIterableIterator<T>;
      all(): Promise<T[]>;
    };
    
    destroy(): void;
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  export function createClient(options?: RepoClientOptions): RepoClient;
  export function getRepository(owner: string, repo: string, options?: RepoClientOptions): Promise<Repository>;
  export function listRepositories(username?: string, options?: RepoClientOptions): Promise<Repository[]>;
  export function createRepository(repoData: CreateRepositoryData, options?: RepoClientOptions): Promise<Repository>;

  export function paginate<T>(httpClient: any, endpoint: string, options?: any): {
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
    all(limit?: number): Promise<T[]>;
    first(count?: number): Promise<T | T[]>;
  };
  
  export function paginateAll<T>(httpClient: any, endpoint: string, options?: any): Promise<T[]>;

  export function validateInput(value: any, rules: any[]): boolean;
  export function validateRepository(data: CreateRepositoryData): boolean;
  export function validateRepositoryName(name: string): boolean;
  export function validateUsername(username: string): boolean;
  export function validateBranchName(branchName: string): boolean;
  export function validateTagName(tagName: string): boolean;

  // ============================================================================
  // Package Info
  // ============================================================================

  export const packageInfo: {
    name: string;
    version: string;
    description: string;
    homepage: string;
  };

  // ============================================================================
  // Default Export
  // ============================================================================

  export default RepoClient;
}