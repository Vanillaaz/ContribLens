/**
 * REST adapter: list commits for a repository filtered by author and time window.
 *
 * Endpoint: GET /repos/{owner}/{repo}/commits
 * GitHub docs: https://docs.github.com/en/rest/commits/commits#list-commits
 *
 * This provides commit SHAs and basic metadata. File-level detail
 * is fetched separately via getCommitDetail.
 */

/** Shape of a single commit in the list-commits response. */
export interface CommitListItem {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string | null;
      email: string | null;
      date: string | null;
    };
    committer: {
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
}

/** Parameters for the commit list request. */
export interface ListCommitsParams {
  owner: string;
  repo: string;
  author: string;
  since: string; // ISO 8601
  until: string; // ISO 8601
  perPage?: number;
  page?: number;
}
