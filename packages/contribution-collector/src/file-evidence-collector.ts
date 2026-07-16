/**
 * File evidence collector.
 *
 * Fetches file-level change detail for:
 * 1. Authored pull requests (preferred source — PR file list)
 * 2. Qualifying commits not covered by an authored PR (fallback — commit detail)
 *
 * Tracks all truncations, caps, and inaccessible sources via CoverageTracker.
 */

import {
  type ChangedFile,
  type Commit,
  type FileStatus,
  type PullRequest,
  type Repository,
} from "@ContribLens/domain";
import {
  PR_FILE_LIST_ABSOLUTE_MAX,
  mapToAnalyticsError,
  type IGitHubClient,
  type PullRequestFile,
  type CommitDetailFile,
} from "@ContribLens/github-client";
import type { CoverageTracker } from "./coverage-tracker.js";
import type { CollectorConfig } from "./collector-config.js";

function toFileStatus(raw: string): FileStatus {
  const valid: FileStatus[] = ["added", "modified", "removed", "renamed", "copied", "changed"];
  return (valid.includes(raw as FileStatus) ? raw : "unknown") as FileStatus;
}

function mapPrFile(
  rawFile: PullRequestFile,
  pr: PullRequest,
  repo: Repository,
): ChangedFile {
  return {
    repositoryId: repo.id,
    pullRequestNodeId: pr.nodeId,
    pullRequestNumber: pr.number,
    commitSha: null,
    path: rawFile.filename,
    previousPath: rawFile.previous_filename ?? null,
    status: toFileStatus(rawFile.status),
    additions: rawFile.additions,
    deletions: rawFile.deletions,
    patch: rawFile.patch ?? null,
    evidenceSource: "pr-files",
  };
}

function mapCommitFile(
  rawFile: CommitDetailFile,
  commit: Commit,
  repo: Repository,
): ChangedFile {
  return {
    repositoryId: repo.id,
    pullRequestNodeId: null,
    pullRequestNumber: null,
    commitSha: commit.sha,
    path: rawFile.filename,
    previousPath: rawFile.previous_filename ?? null,
    status: toFileStatus(rawFile.status),
    additions: rawFile.additions,
    deletions: rawFile.deletions,
    patch: rawFile.patch ?? null,
    evidenceSource: "commit-detail",
  };
}

export class FileEvidenceCollector {
  private prFetchCount = 0;
  private commitFetchCount = 0;

  constructor(
    private readonly client: IGitHubClient,
    private readonly config: CollectorConfig,
    private readonly coverageTracker: CoverageTracker,
  ) {}

  /** Fetches file list for an authored pull request. */
  async collectPrFiles(
    pr: PullRequest,
    repo: Repository,
    correlationId: string,
  ): Promise<ChangedFile[]> {
    if (this.prFetchCount >= this.config.maxPullRequestFileListFetches) {
      this.coverageTracker.recordCommitWithoutFileDetail();
      return [];
    }

    if (this.client.isBudgetLow()) return [];

    this.prFetchCount++;
    const owner = repo.owner;
    const repoName = repo.name;
    const allFiles: ChangedFile[] = [];
    let page = 1;
    let totalFetched = 0;
    let truncated = false;

    try {
      while (page <= this.config.maxPagesPerRequest) {
        if (this.client.isBudgetLow()) {
          truncated = true;
          break;
        }

        const files = await this.client.listPullRequestFiles({
          owner,
          repo: repoName,
          pullNumber: Number(pr.number),
          page,
          perPage: this.config.perPage,
        });

        for (const f of files) {
          allFiles.push(mapPrFile(f, pr, repo));
        }

        totalFetched += files.length;

        if (totalFetched >= PR_FILE_LIST_ABSOLUTE_MAX) {
          truncated = true;
          break;
        }

        if (files.length < this.config.perPage) break;
        page++;
      }
    } catch (err: unknown) {
      void mapToAnalyticsError(err, correlationId, `PR #${String(pr.number)} files`);
      this.coverageTracker.recordInaccessibleSource(
        repo.id,
        repo.slug,
        "api_error",
        true,
      );
      return allFiles; // Return what we have
    }

    if (truncated) {
      this.coverageTracker.recordPrWithTruncatedFileList();
    }

    return allFiles;
  }

  /** Fetches file-level detail for a single commit. */
  async collectCommitFiles(
    commit: Commit,
    repo: Repository,
    correlationId: string,
  ): Promise<ChangedFile[]> {
    if (this.commitFetchCount >= this.config.maxCommitsForFileDetail) {
      this.coverageTracker.recordCommitWithoutFileDetail();
      return [];
    }

    if (this.client.isBudgetLow()) {
      this.coverageTracker.recordCommitWithoutFileDetail();
      return [];
    }

    this.commitFetchCount++;
    const allFiles: ChangedFile[] = [];

    try {
      const detail = await this.client.getCommitDetail(
        repo.owner,
        repo.name,
        commit.sha,
      );

      for (const f of detail.files ?? []) {
        allFiles.push(mapCommitFile(f, commit, repo));
      }

      this.coverageTracker.recordCommitWithFileDetail();
    } catch (err: unknown) {
      void mapToAnalyticsError(err, correlationId, `commit ${commit.sha} files`);
      this.coverageTracker.recordCommitWithoutFileDetail();
      this.coverageTracker.recordInaccessibleSource(
        repo.id,
        repo.slug,
        "api_error",
        true,
      );
    }

    return allFiles;
  }

}
