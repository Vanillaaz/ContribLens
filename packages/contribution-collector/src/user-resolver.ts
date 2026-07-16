/**
 * User resolver.
 *
 * Resolves a GitHub login to a DeveloperIdentity domain object.
 * This is the first step in every analytics run.
 */

import {
  createAnalyticsError,
  toGitHubLogin,
  toGitHubNodeId,
  type AnalyticsError,
  type DeveloperIdentity,
} from "@ContribLens/domain";
import { mapToAnalyticsError } from "@ContribLens/github-client";
import type { IGitHubClient } from "@ContribLens/github-client";

export class UserResolver {
  constructor(private readonly client: IGitHubClient) {}

  /**
   * Resolves a GitHub login to DeveloperIdentity.
   *
   * @returns The resolved identity, or an AnalyticsError if the login does not exist.
   */
  async resolve(
    login: string,
    correlationId: string,
  ): Promise<DeveloperIdentity | AnalyticsError> {
    try {
      const response = await this.client.getUserIdentity({ login });

      if (!response.user) {
        return createAnalyticsError(
          "USER_NOT_FOUND",
          `GitHub user "${login}" does not exist or is not accessible.`,
          correlationId,
        );
      }

      const { user } = response;

      return {
        login: toGitHubLogin(user.login),
        nodeId: toGitHubNodeId(user.id),
        displayName: user.name,
        contributionYears: user.contributionsCollection.contributionYears,
      };
    } catch (err: unknown) {
      return mapToAnalyticsError(err, correlationId, `resolving user "${login}"`);
    }
  }
}
