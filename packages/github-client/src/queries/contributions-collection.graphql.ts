/**
 * Named GraphQL query: contribution collection for a time window.
 *
 * This is the primary repository discovery mechanism. It returns all
 * repositories in which GitHub recognized the developer's contribution
 * activity within the requested window.
 *
 * IMPORTANT: `maxRepositories` must be set to 100 (the documented maximum).
 * The default is 25, which causes silent truncation. When the response
 * indicates truncation, confidence is lowered.
 *
 * GitHub GraphQL reference:
 * https://docs.github.com/en/graphql/reference/objects#contributionscollection
 */

export const CONTRIBUTIONS_COLLECTION_QUERY = /* GraphQL */ `
  query ContributionsCollection($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        hasActivityInThePast
        restrictedContributionsCount

        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            id
            name
            owner {
              login
            }
            isFork
            isArchived
            isPrivate
            primaryLanguage {
              name
            }
          }
          contributions {
            totalCount
          }
        }

        pullRequestContributionsByRepository(maxRepositories: 100) {
          repository {
            id
            name
            owner {
              login
            }
          }
          contributions {
            totalCount
          }
        }

        pullRequestReviewContributionsByRepository(maxRepositories: 100) {
          repository {
            id
            name
            owner {
              login
            }
          }
          contributions {
            totalCount
          }
        }
      }
    }
  }
`;

/** Raw repository shape in contribution collection responses. */
export interface ContributionRepository {
  id: string;
  name: string;
  owner: { login: string };
  isFork?: boolean;
  isArchived?: boolean;
  isPrivate?: boolean;
  primaryLanguage?: { name: string } | null;
}

/** Raw per-repository contribution entry. */
export interface RepositoryContributionEntry {
  repository: ContributionRepository;
  contributions: { totalCount: number };
}

/** Full typed response shape for ContributionsCollection. */
export interface ContributionsCollectionQueryResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalIssueContributions: number;
      hasActivityInThePast: boolean;
      restrictedContributionsCount: number;
      commitContributionsByRepository: RepositoryContributionEntry[];
      pullRequestContributionsByRepository: RepositoryContributionEntry[];
      pullRequestReviewContributionsByRepository: RepositoryContributionEntry[];
    };
  } | null;
}

export interface ContributionsCollectionQueryVariables {
  login: string;
  from: string; // ISO 8601 DateTime
  to: string;   // ISO 8601 DateTime
}
