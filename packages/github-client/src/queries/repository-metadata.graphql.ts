/**
 * Named GraphQL query: batch repository metadata.
 *
 * Used to enrich repositories with metadata not returned by the
 * contribution collection (e.g., organization membership context).
 *
 * Batched using GraphQL aliases to minimize request count.
 * The query is constructed dynamically from a list of node IDs.
 */

/**
 * Builds a batched GraphQL query to fetch metadata for multiple repositories
 * by their stable GitHub node IDs.
 *
 * @param nodeIds - Array of stable GitHub repository node IDs.
 * @returns A GraphQL query string with aliased `node` fields.
 */
export function buildRepositoryMetadataBatchQuery(nodeIds: string[]): string {
  const aliases = nodeIds
    .map(
      (id, i) => /* GraphQL */ `
      repo${i.toString()}: node(id: "${id}") {
        ... on Repository {
          id
          name
          isPrivate
          isArchived
          isFork
          owner {
            __typename
            login
            ... on Organization {
              name
            }
          }
          primaryLanguage {
            name
          }
          defaultBranchRef {
            name
          }
        }
      }
    `,
    )
    .join("\n");

  return `query RepositoryMetadataBatch { ${aliases} }`;
}

/** Shape of a single repository node response. */
export interface RepositoryMetadataNode {
  id: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
  isFork: boolean;
  owner: {
    __typename: string;
    login: string;
    name?: string;
  };
  primaryLanguage: { name: string } | null;
  defaultBranchRef: { name: string } | null;
}

/** Shape of the full batched response (dynamic alias keys). */
export type RepositoryMetadataBatchResponse = Record<
  string,
  RepositoryMetadataNode | null
>;
