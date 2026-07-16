/**
 * Test helpers for the contribution-rules package.
 *
 * Provides factory functions for building minimal ChangedFile and RuleContext
 * fixtures with sensible defaults that individual tests can override.
 */

import type { ChangedFile, FileStatus } from "@ContribLens/domain";

import type { RuleContext } from "../rule-context.js";

/** Counter used to generate unique repository IDs in tests. */
let repoIdCounter = 1;

function makeRepoId(): import("@ContribLens/domain").RepositoryId {
  return `MDEwOlJlcG9zaXRvcnk${(repoIdCounter++).toString()}` as import("@ContribLens/domain").RepositoryId;
}

/**
 * Builds a minimal ChangedFile for testing.
 *
 * Only `path` is required. All other fields default to sensible values
 * representing a typical modified source file with a small diff.
 */
export function makeFile(
  overrides: Partial<ChangedFile> & { path: string },
): ChangedFile {
  return {
    repositoryId: makeRepoId(),
    pullRequestNodeId: null,
    pullRequestNumber: null,
    commitSha: null,
    previousPath: null,
    status: "modified" as FileStatus,
    additions: 10,
    deletions: 5,
    patch: null,
    evidenceSource: "commit-detail",
    ...overrides,
  };
}

/**
 * Builds a minimal RuleContext for testing.
 * Defaults to: no commit, no PR, not a merge commit.
 */
export function makeContext(
  overrides: Partial<RuleContext> = {},
): RuleContext {
  return {
    commit: null,
    pullRequest: null,
    isMergeCommit: false,
    ...overrides,
  };
}

/**
 * Builds a RuleContext representing a merge commit.
 */
export function makeMergeCommitContext(): RuleContext {
  return makeContext({ isMergeCommit: true });
}
