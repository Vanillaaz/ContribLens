/**
 * REST adapter: list files changed in a pull request.
 *
 * Endpoint: GET /repos/{owner}/{repo}/pulls/{pull_number}/files
 * GitHub docs: https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files
 *
 * This is the PREFERRED source for file-level change evidence because it
 * describes the complete submitted change set without branch traversal ambiguity.
 *
 * API caps:
 * - Up to 3000 files total (paginated).
 * - Hitting this cap lowers result confidence.
 */

/** Shape of a file in a PR files response. */
export interface PullRequestFile {
  filename: string;
  previous_filename?: string;
  status: string; // "added" | "modified" | "removed" | "renamed" | "copied" | "changed"
  additions: number;
  deletions: number;
  changes: number;
  patch?: string; // Absent for binary or very large files
}

/** Absolute maximum files GitHub returns for a PR. */
export const PR_FILE_LIST_ABSOLUTE_MAX = 3000;
