/**
 * Rule evaluation context.
 *
 * Provides the surrounding commit/PR metadata available to a rule
 * when evaluating a specific changed file. Rules may use this context
 * to make more informed decisions (e.g., a file changed only in merge commits).
 */

import type { Commit } from "@ContribLens/domain";
import type { PullRequest } from "@ContribLens/domain";

/**
 * Context provided to each rule during evaluation of a changed file.
 *
 * All fields are optional — the context available depends on which
 * discovery path produced the file (PR files vs commit detail).
 */
export interface RuleContext {
  /**
   * The commit this file was found in, if applicable.
   * Null for files discovered via PR file list without a specific commit.
   */
  readonly commit: Commit | null;
  /**
   * The pull request this file belongs to, if applicable.
   * Null for files discovered via individual commit detail.
   */
  readonly pullRequest: PullRequest | null;
  /**
   * Whether the containing commit (if any) is a merge commit.
   * Derived from commit.isMergeCommit for convenience.
   */
  readonly isMergeCommit: boolean;
}

/** Constructs a rule context from available PR/commit data. */
export function createRuleContext(options: {
  commit?: Commit | null;
  pullRequest?: PullRequest | null;
}): RuleContext {
  const commit = options.commit ?? null;
  return {
    commit,
    pullRequest: options.pullRequest ?? null,
    isMergeCommit: commit?.isMergeCommit ?? false,
  };
}
