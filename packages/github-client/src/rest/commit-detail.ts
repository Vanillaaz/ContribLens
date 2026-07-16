/**
 * REST adapter: fetch a single commit with file-level detail.
 *
 * Endpoint: GET /repos/{owner}/{repo}/commits/{sha}
 * GitHub docs: https://docs.github.com/en/rest/commits/commits#get-a-commit
 *
 * Returns: commit metadata + files array (up to 300 files; paginated up to 3000).
 * Files beyond 300 require page parameters. Hitting the 3000-file cap lowers confidence.
 *
 * Binary files may not include a patch. Large diffs can time out.
 */

/** Shape of a file in a commit detail response. */
export interface CommitDetailFile {
  filename: string;
  previous_filename?: string;
  status: string; // "added" | "modified" | "removed" | "renamed" | "copied" | "changed"
  additions: number;
  deletions: number;
  changes: number;
  patch?: string; // Absent for binary or very large files
}

/** Shape of the full commit detail response. */
export interface CommitDetailResponse {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string | null;
      email: string | null;
      date: string | null;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
  } | null;
  parents: { sha: string }[];
  files?: CommitDetailFile[];
  /** GitHub reports the total file count here even when paginated. */
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

/** Maximum files GitHub returns in a single commit detail response. */
export const COMMIT_DETAIL_FILE_CAP = 300;

/** Absolute maximum files GitHub will return across paginated commit requests. */
export const COMMIT_DETAIL_ABSOLUTE_MAX = 3000;
