/**
 * Coverage tracker.
 *
 * Accumulates coverage statistics during a collection run.
 * These statistics feed directly into the confidence model.
 *
 * The tracker is mutable and intended to be passed to sub-collectors
 * which record observations as they work.
 */

import type {
  InaccessibilityReason,
  InaccessibleSource,
  RepositoryId,
  SourceCoverage,
} from "@ContribLens/domain";

export class CoverageTracker {
  private _discoveredRepositoryCount = 0;
  private _fullyAccessibleRepositoryCount = 0;
  private readonly _inaccessibleSources: InaccessibleSource[] = [];
  private _commitsWithFileDetail = 0;
  private _commitsWithoutFileDetail = 0;
  private _prsWithTruncatedFileList = 0;
  private _repositoryDiscoveryTruncated = false;
  private _paginationIncompleteCount = 0;

  // ---- Recording methods (called by sub-collectors) -------------------------

  recordRepositoryDiscovered(): void {
    this._discoveredRepositoryCount++;
  }

  recordRepositoryFullyAccessible(): void {
    this._fullyAccessibleRepositoryCount++;
  }

  recordInaccessibleSource(
    repositoryId: RepositoryId,
    repositorySlug: string,
    reason: InaccessibilityReason,
    hasKnownContributions: boolean,
  ): void {
    this._inaccessibleSources.push({
      repositoryId,
      repositorySlug,
      reason,
      hasKnownContributions,
    });
  }

  recordCommitWithFileDetail(): void {
    this._commitsWithFileDetail++;
  }

  recordCommitWithoutFileDetail(): void {
    this._commitsWithoutFileDetail++;
  }

  recordPrWithTruncatedFileList(): void {
    this._prsWithTruncatedFileList++;
  }

  recordRepositoryDiscoveryTruncated(): void {
    this._repositoryDiscoveryTruncated = true;
  }

  recordPaginationIncomplete(): void {
    this._paginationIncompleteCount++;
  }

  // ---- Snapshot (immutable read) --------------------------------------------

  toSourceCoverage(): SourceCoverage {
    return {
      discoveredRepositoryCount: this._discoveredRepositoryCount,
      fullyAccessibleRepositoryCount: this._fullyAccessibleRepositoryCount,
      inaccessibleSources: [...this._inaccessibleSources],
      commitsWithFileDetail: this._commitsWithFileDetail,
      commitsWithoutFileDetail: this._commitsWithoutFileDetail,
      prsWithTruncatedFileList: this._prsWithTruncatedFileList,
      repositoryDiscoveryTruncated: this._repositoryDiscoveryTruncated,
      paginationIncompleteCount: this._paginationIncompleteCount,
    };
  }

  // ---- Convenience accessors ------------------------------------------------

  get discoveredRepositoryCount(): number {
    return this._discoveredRepositoryCount;
  }

  get commitsWithFileDetail(): number {
    return this._commitsWithFileDetail;
  }

  get commitsWithoutFileDetail(): number {
    return this._commitsWithoutFileDetail;
  }
}
