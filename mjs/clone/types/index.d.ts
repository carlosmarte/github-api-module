/**
 * TypeScript definitions for @thinkeloquent/clone
 */

import { SimpleGit, SimpleGitOptions, PullResult, PushResult, StatusResult, BranchSummary, RemoteWithRefs, DefaultLogFields } from 'simple-git';

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorContext {
  [key: string]: any;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
}

export interface GitErrorJSON {
  name: string;
  message: string;
  stack?: string;
  timestamp: string;
  context: ErrorContext;
  originalError?: ErrorDetails | null;
}

export class GitError extends Error {
  name: 'GitError';
  originalError?: Error;
  context: ErrorContext;
  timestamp: string;
  
  constructor(message: string, originalError?: Error, context?: ErrorContext);
  toJSON(): GitErrorJSON;
}

export class AuthError extends GitError {
  name: 'AuthError';
  constructor(message: string, originalError?: Error, context?: ErrorContext);
}

export interface ValidationDetails {
  field?: string;
  value?: any;
  type?: string;
  [key: string]: any;
}

export class ValidationError extends GitError {
  name: 'ValidationError';
  validationDetails: ValidationDetails;
  
  constructor(message: string, validationDetails?: ValidationDetails, context?: ErrorContext);
  toJSON(): GitErrorJSON & { validationDetails: ValidationDetails };
}

export class RepositoryError extends GitError {
  name: 'RepositoryError';
  repoName?: string;
  operation?: string;
  
  constructor(message: string, repoName?: string, operation?: string, originalError?: Error, context?: ErrorContext);
  toJSON(): GitErrorJSON & { repoName?: string; operation?: string };
}

export class CloneError extends RepositoryError {
  name: 'CloneError';
  repoUrl?: string;
  targetDir?: string;
  
  constructor(message: string, repoUrl?: string, targetDir?: string, originalError?: Error, context?: ErrorContext);
  toJSON(): GitErrorJSON & { repoName?: string; operation?: string; repoUrl?: string; targetDir?: string };
}

export class NetworkError extends GitError {
  name: 'NetworkError';
  url?: string;
  statusCode?: number;
  
  constructor(message: string, url?: string, statusCode?: number, originalError?: Error, context?: ErrorContext);
  toJSON(): GitErrorJSON & { url?: string; statusCode?: number };
}

export class FileSystemError extends GitError {
  name: 'FileSystemError';
  path?: string;
  operation?: string;
  
  constructor(message: string, path?: string, operation?: string, originalError?: Error, context?: ErrorContext);
  toJSON(): GitErrorJSON & { path?: string; operation?: string };
}

export class ConfigError extends GitError {
  name: 'ConfigError';
  configKey?: string;
  configValue?: any;
  
  constructor(message: string, configKey?: string, configValue?: any, context?: ErrorContext);
  toJSON(): GitErrorJSON & { configKey?: string; configValue?: any };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface RepositoryValidationOptions {
  allowSSH?: boolean;
  allowHTTPS?: boolean;
  requireGitHub?: boolean;
}

export interface RepositoryValidationResult {
  url: string;
  isSSH: boolean;
  isHTTPS: boolean;
  isGitHub: boolean;
  owner?: string;
  repo?: string;
}

export interface PathValidationOptions {
  mustExist?: boolean;
  mustBeDirectory?: boolean;
  mustBeFile?: boolean;
  checkWritable?: boolean;
}

export interface PathValidationResult {
  originalPath: string;
  resolvedPath: string;
  exists: boolean;
  isAbsolute: boolean;
  isDirectory?: boolean;
  isFile?: boolean;
  size?: number;
  modified?: Date;
  isGitRepository?: boolean;
}

export interface DirectoryNameValidationOptions {
  maxLength?: number;
  allowDots?: boolean;
}

export interface DirectoryNameValidationResult {
  name: string;
  isValid: boolean;
  length: number;
}

export interface GitRefValidationOptions {
  type?: 'branch' | 'tag';
}

export interface GitRefValidationResult {
  ref: string;
  type: string;
  isValid: boolean;
}

export interface GitHubTokenValidationResult {
  isValid: boolean;
  type: 'personal' | 'oauth' | 'user' | 'server' | 'classic';
}

export interface CloneOptionsValidation {
  branch?: string;
  depth?: number;
  bare?: boolean;
}

export interface RepositoryOperationParams {
  repoUrl: string;
  targetDir?: string;
  options?: CloneOptionsValidation;
}

export interface RepositoryOperationValidationResult {
  repository: RepositoryValidationResult;
  directory?: DirectoryNameValidationResult;
  options?: CloneOptionsValidation;
}

// ============================================================================
// Client Types
// ============================================================================

export interface GitClientOptions {
  baseDir?: string;
  token?: string;
  gitOptions?: SimpleGitOptions;
  verbose?: boolean;
  timeout?: number;
}

export interface CloneOptions {
  bare?: boolean;
  branch?: string;
  depth?: number;
  progress?: (progress: any) => void;
}

export interface PullOptions {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}

export interface PushOptions {
  remote?: string;
  branch?: string;
  force?: boolean;
  setUpstream?: boolean;
}

export interface InitOptions {
  bare?: boolean;
}

export interface RepositoryInfo {
  name: string;
  path: string;
  url?: string;
  branch?: string;
  status?: StatusResult;
  remotes?: RemoteWithRefs[];
  branches?: BranchSummary;
  recentCommits?: DefaultLogFields[];
  clonedAt?: string;
  initializedAt?: string;
  lastUpdated?: string;
}

export interface PullResultInfo {
  name: string;
  path: string;
  result: PullResult;
  status: StatusResult;
  pulledAt: string;
}

export interface PushResultInfo {
  name: string;
  path: string;
  result: PushResult;
  status: StatusResult;
  pushedAt: string;
}

export interface StatusResultInfo {
  name: string;
  path: string;
  branch?: string;
  status: StatusResult;
  remotes: RemoteWithRefs[];
  branches: BranchSummary;
  recentCommits: DefaultLogFields[];
  lastUpdated: string;
}

export interface InitResultInfo {
  name: string;
  path: string;
  bare: boolean;
  initializedAt: string;
}

export class GitClient {
  readonly baseDir: string;
  readonly token?: string;
  readonly verbose: boolean;
  readonly timeout: number;
  readonly git: SimpleGit;
  
  constructor(options?: GitClientOptions);
  
  clone(repoUrl: string, targetDir?: string, options?: CloneOptions): Promise<RepositoryInfo>;
  pull(repoName: string, options?: PullOptions): Promise<PullResultInfo>;
  push(repoName: string, options?: PushOptions): Promise<PushResultInfo>;
  status(repoName: string): Promise<StatusResultInfo>;
  listRepositories(): Promise<StatusResultInfo[]>;
  init(repoName: string, options?: InitOptions): Promise<InitResultInfo>;
}

// ============================================================================
// Operations API Types
// ============================================================================

export interface OperationClientOptions {
  token?: string;
  baseDir?: string;
  verbose?: boolean;
  timeout?: number;
}

export interface CloneOperationOptions {
  client?: OperationClientOptions;
  clone?: CloneOptions;
  onProgress?: (progress: number) => void;
}

export interface PullOperationOptions {
  client?: OperationClientOptions;
  pull?: PullOptions;
}

export interface PushOperationOptions {
  client?: OperationClientOptions;
  push?: PushOptions;
}

export interface StatusOperationOptions {
  client?: OperationClientOptions;
}

export interface ListOperationOptions {
  client?: OperationClientOptions;
}

export interface InitOperationOptions {
  client?: OperationClientOptions;
  init?: InitOptions;
}

export interface SyncOperationOptions {
  client?: OperationClientOptions;
  pull?: PullOptions;
  push?: PushOptions;
  autoPush?: boolean;
}

export interface SyncResult {
  name: string;
  path: string;
  pull: PullResultInfo;
  push?: PushResultInfo;
  syncedAt: string;
}

export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ repoUrl?: string; repoName?: string; error: string }>;
  total: number;
  successCount: number;
  errorCount: number;
}

export interface BatchCloneOptions {
  client?: OperationClientOptions;
  clone?: CloneOptions;
  onProgress?: (repoUrl: string, progress: number) => void;
  onComplete?: (repoUrl: string, result: RepositoryInfo | null, error: Error | null) => void;
  concurrency?: number;
}

export interface BatchSyncOptions {
  client?: OperationClientOptions;
  pull?: PullOptions;
  push?: PushOptions;
  autoPush?: boolean;
  onComplete?: (repoName: string, result: SyncResult | null, error: Error | null) => void;
  concurrency?: number;
}

export interface RepositoryHealth {
  name: string;
  path: string;
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  lastChecked: string;
}

// ============================================================================
// Main Module Types
// ============================================================================

export interface ConvenienceOptions extends OperationClientOptions {
  branch?: string;
  depth?: number;
  bare?: boolean;
  remote?: string;
  rebase?: boolean;
  force?: boolean;
  setUpstream?: boolean;
  onProgress?: (progress: number) => void;
  autoPush?: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  homepage: string;
}

// ============================================================================
// Function Declarations
// ============================================================================

// Error utilities
export function wrapError(error: Error, operation: string, context?: ErrorContext): GitError;
export function isErrorType(error: Error, errorClass: new (...args: any[]) => Error): boolean;
export function getErrorInfo(error: Error): GitErrorJSON | { name: string; message: string; stack?: string; timestamp: string };

// Validation functions
export function validateRepository(repoUrl: string, options?: RepositoryValidationOptions): RepositoryValidationResult;
export function validatePath(path: string, options?: PathValidationOptions): PathValidationResult;
export function validateDirectoryName(name: string, options?: DirectoryNameValidationOptions): DirectoryNameValidationResult;
export function validateGitRef(ref: string, options?: GitRefValidationOptions): GitRefValidationResult;
export function validateGitHubToken(token: string): GitHubTokenValidationResult;
export function validateCloneOptions(options?: CloneOptions): CloneOptionsValidation;
export function validateRepositoryOperation(params: RepositoryOperationParams): RepositoryOperationValidationResult;

// Operations API
export function cloneRepository(repoUrl: string, targetDir?: string, options?: CloneOperationOptions): Promise<RepositoryInfo>;
export function pullRepository(repoName: string, options?: PullOperationOptions): Promise<PullResultInfo>;
export function pushRepository(repoName: string, options?: PushOperationOptions): Promise<PushResultInfo>;
export function getRepositoryStatus(repoName: string, options?: StatusOperationOptions): Promise<StatusResultInfo>;
export function listRepositories(options?: ListOperationOptions): Promise<StatusResultInfo[]>;
export function initRepository(repoName: string, options?: InitOperationOptions): Promise<InitResultInfo>;
export function syncRepository(repoName: string, options?: SyncOperationOptions): Promise<SyncResult>;
export function batchClone(repoUrls: string[], options?: BatchCloneOptions): Promise<BatchResult<RepositoryInfo>>;
export function batchSync(repoNames: string[], options?: BatchSyncOptions): Promise<BatchResult<SyncResult>>;
export function getRepositoryHealth(repoName: string, options?: StatusOperationOptions): Promise<RepositoryHealth>;

// Main exports
export function createClient(options?: GitClientOptions): GitClient;
export default GitClient;

// Convenience functions
export function clone(repoUrl: string, targetDir?: string, options?: ConvenienceOptions): Promise<RepositoryInfo>;
export function pull(repoName: string, options?: ConvenienceOptions): Promise<PullResultInfo>;
export function push(repoName: string, options?: ConvenienceOptions): Promise<PushResultInfo>;
export function status(repoName: string, options?: ConvenienceOptions): Promise<StatusResultInfo>;
export function list(options?: ConvenienceOptions): Promise<StatusResultInfo[]>;
export function init(repoName: string, options?: ConvenienceOptions): Promise<InitResultInfo>;
export function sync(repoName: string, options?: ConvenienceOptions): Promise<SyncResult>;

export const packageInfo: PackageInfo;