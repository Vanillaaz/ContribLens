/**
 * Branded primitive types for GitHub entity identity.
 *
 * Using branded types prevents accidental interchange of semantically
 * distinct string values (e.g., passing a login where a node ID is expected).
 */

declare const brand: unique symbol;

type Brand<T, B> = T & { readonly [brand]: B };

/** A GitHub username / login handle, e.g. "torvalds". */
export type GitHubLogin = Brand<string, "GitHubLogin">;

/** An opaque GitHub global node ID used for stable deduplication. */
export type GitHubNodeId = Brand<string, "GitHubNodeId">;

/** The owner segment of a repository slug, e.g. "microsoft". */
export type RepoOwner = Brand<string, "RepoOwner">;

/** The repository name segment of a slug, e.g. "vscode". */
export type RepoName = Brand<string, "RepoName">;

/** Constructs a typed login from an untyped string. Use only at ingestion boundaries. */
export function toGitHubLogin(raw: string): GitHubLogin {
  return raw as GitHubLogin;
}

/** Constructs a typed node ID from an untyped string. Use only at ingestion boundaries. */
export function toGitHubNodeId(raw: string): GitHubNodeId {
  return raw as GitHubNodeId;
}

/** Constructs a typed repo owner from an untyped string. Use only at ingestion boundaries. */
export function toRepoOwner(raw: string): RepoOwner {
  return raw as RepoOwner;
}

/** Constructs a typed repo name from an untyped string. Use only at ingestion boundaries. */
export function toRepoName(raw: string): RepoName {
  return raw as RepoName;
}
