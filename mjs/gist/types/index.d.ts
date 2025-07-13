declare module '@github-api/gist' {
  export interface GistFile {
    filename?: string;
    type?: string;
    language?: string;
    raw_url?: string;
    size?: number;
    truncated?: boolean;
    content?: string;
    encoding?: string;
  }
  
  export interface GistUser {
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
    name?: string | null;
    email?: string | null;
  }
  
  export interface Gist {
    id: string;
    node_id: string;
    url: string;
    forks_url: string;
    commits_url: string;
    git_pull_url: string;
    git_push_url: string;
    html_url: string;
    files: Record<string, GistFile>;
    public: boolean;
    created_at: string;
    updated_at: string;
    description: string | null;
    comments: number;
    comments_enabled?: boolean;
    user: GistUser | null;
    comments_url: string;
    owner?: GistUser;
    truncated?: boolean;
    forks?: any[];
    history?: GistHistory[];
  }
  
  export interface GistComment {
    id: number;
    node_id: string;
    url: string;
    body: string;
    user: GistUser | null;
    created_at: string;
    updated_at: string;
    author_association: string;
  }
  
  export interface GistCommit {
    url: string;
    version: string;
    user: GistUser | null;
    change_status: {
      total: number;
      additions: number;
      deletions: number;
    };
    committed_at: string;
  }
  
  export interface GistHistory {
    user: GistUser | null;
    version: string;
    committed_at: string;
    change_status: {
      total: number;
      additions: number;
      deletions: number;
    };
    url: string;
  }
  
  export interface CreateGistInput {
    description?: string;
    public?: boolean;
    files: Record<string, { content: string }>;
  }
  
  export interface UpdateGistInput {
    description?: string;
    files?: Record<string, { content?: string; filename?: string } | null>;
  }
  
  export interface PaginationOptions {
    per_page?: number;
    page?: number;
    since?: string;
  }
  
  export interface ClientOptions {
    token?: string;
    baseURL?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }
  
  export class GistAPIError extends Error {
    statusCode: number;
    response?: any;
  }
  
  export class AuthenticationError extends GistAPIError {}
  export class RateLimitError extends GistAPIError {
    resetTime: number;
    limit: number;
    remaining: number;
  }
  export class ValidationError extends GistAPIError {
    errors: any[];
  }
  export class NotFoundError extends GistAPIError {}
  export class ForbiddenError extends GistAPIError {}
  
  export class AuthManager {
    constructor(options?: ClientOptions);
    loadToken(): string | undefined;
    getHeaders(additionalHeaders?: Record<string, string>): Record<string, string>;
    isAuthenticated(): boolean;
    requireAuth(): void;
  }
  
  export class ConfigManager {
    load(): Record<string, any>;
    save(config: Record<string, any>): boolean;
    get(key: string): any;
    set(key: string, value: any): boolean;
    delete(key: string): boolean;
    clear(): boolean;
  }
  
  export class GistsEndpoint {
    list(options?: PaginationOptions): Promise<Gist[]>;
    listPublic(options?: PaginationOptions): Promise<Gist[]>;
    listStarred(options?: PaginationOptions): Promise<Gist[]>;
    listForUser(username: string, options?: PaginationOptions): Promise<Gist[]>;
    get(gistId: string, options?: { raw?: boolean; base64?: boolean }): Promise<Gist>;
    getRevision(gistId: string, sha: string, options?: { raw?: boolean; base64?: boolean }): Promise<Gist>;
    create(data: CreateGistInput): Promise<Gist>;
    update(gistId: string, data: UpdateGistInput): Promise<Gist>;
    delete(gistId: string): Promise<boolean>;
    fork(gistId: string): Promise<Gist>;
    listForks(gistId: string, options?: PaginationOptions): Promise<Gist[]>;
    iterate(options?: PaginationOptions): AsyncIterableIterator<Gist>;
    iteratePublic(options?: PaginationOptions): AsyncIterableIterator<Gist>;
  }
  
  export class CommentsEndpoint {
    list(gistId: string, options?: PaginationOptions): Promise<GistComment[]>;
    get(gistId: string, commentId: number, options?: { raw?: boolean; base64?: boolean }): Promise<GistComment>;
    create(gistId: string, data: { body: string }): Promise<GistComment>;
    update(gistId: string, commentId: number, data: { body: string }): Promise<GistComment>;
    delete(gistId: string, commentId: number): Promise<boolean>;
    iterate(gistId: string, options?: PaginationOptions): AsyncIterableIterator<GistComment>;
  }
  
  export class CommitsEndpoint {
    list(gistId: string, options?: PaginationOptions): Promise<GistCommit[]>;
    get(gistId: string, sha: string): Promise<Gist>;
    iterate(gistId: string, options?: PaginationOptions): AsyncIterableIterator<GistCommit>;
    getStats(gistId: string): Promise<{
      totalCommits: number;
      totalAdditions: number;
      totalDeletions: number;
      totalChanges: number;
      commits: any[];
    }>;
  }
  
  export class ForksEndpoint {
    list(gistId: string, options?: PaginationOptions): Promise<Gist[]>;
    create(gistId: string): Promise<Gist>;
    iterate(gistId: string, options?: PaginationOptions): AsyncIterableIterator<Gist>;
  }
  
  export class StarsEndpoint {
    check(gistId: string): Promise<boolean>;
    add(gistId: string): Promise<boolean>;
    remove(gistId: string): Promise<boolean>;
    list(options?: PaginationOptions): Promise<Gist[]>;
    toggle(gistId: string): Promise<boolean>;
  }
  
  export default class GistAPI {
    constructor(options?: ClientOptions);
    gists: GistsEndpoint;
    comments: CommentsEndpoint;
    commits: CommitsEndpoint;
    forks: ForksEndpoint;
    stars: StarsEndpoint;
    getRateLimit(): Promise<any>;
    getUser(): Promise<any>;
    withOptions(options: ClientOptions): GistAPI;
  }
  
  export const gistAPI: GistAPI;
  export { GistAPI };
}