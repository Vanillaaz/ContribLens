/**
 * Repository classifier.
 *
 * Determines the RepositoryRelationship for a repository relative to
 * the subject developer.
 *
 * - `owned`    — the developer's own login matches the repository owner.
 * - `org`      — the repository is owned by a GitHub organization.
 * - `external` — owned by another individual.
 * - `unknown`  — ownership could not be determined.
 */

import type { GitHubLogin, RepositoryRelationship } from "@ContribLens/domain";
import type { RepositoryMetadataNode } from "@ContribLens/github-client";

/**
 * Classifies a repository's relationship to the subject developer.
 */
export function classifyRepository(
  metadata: RepositoryMetadataNode | null,
  subjectLogin: GitHubLogin,
): RepositoryRelationship {
  if (!metadata) return "unknown";

  const ownerLogin = metadata.owner.login.toLowerCase();
  const subject = subjectLogin.toLowerCase();

  if (ownerLogin === subject) {
    return "owned";
  }

  // GitHub GraphQL __typename for organizations is "Organization"
  if (metadata.owner.__typename === "Organization") {
    return "org";
  }

  return "external";
}
