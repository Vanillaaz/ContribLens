/**
 * Named GraphQL query: resolve user identity and contribution years.
 *
 * This is the first query in every analytics run. It establishes:
 * 1. That the login exists (404 = user not found).
 * 2. The stable node ID for deduplication.
 * 3. The years for which GitHub reports contribution activity.
 *    This constrains which time windows are valid.
 *
 * GitHub GraphQL reference: https://docs.github.com/en/graphql/reference/objects#user
 */

export const USER_IDENTITY_QUERY = /* GraphQL */ `
  query UserIdentity($login: String!) {
    user(login: $login) {
      id
      login
      name
      createdAt
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

/**
 * Expected shape of the UserIdentity query response.
 * This type is private to the github-client package — the collector
 * receives normalized domain objects, not raw GraphQL responses.
 */
export interface UserIdentityQueryResponse {
  user: {
    id: string;
    login: string;
    name: string | null;
    createdAt: string;
    contributionsCollection: {
      contributionYears: number[];
    };
  } | null;
}

export interface UserIdentityQueryVariables {
  login: string;
}
