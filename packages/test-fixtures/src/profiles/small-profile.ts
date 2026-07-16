export const smallProfileIdentity = {
  user: {
    login: "small-user",
    id: "MDQ6VXNlcjEyMw==",
    name: "Small User",
    avatarUrl: "https://avatars.githubusercontent.com/u/123?v=4",
    createdAt: "2020-01-01T00:00:00Z",
    contributionsCollection: {
      contributionYears: [2023, 2022, 2021, 2020]
    }
  },
};

export const smallProfileContributions = {
  user: {
    contributionsCollection: {
      hasAnyContributions: true,
      totalCommitContributions: 5,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      totalIssueContributions: 0,
      commitContributionsByRepository: [
        {
          repository: {
            id: "R_kgDOA1b2c3",
            name: "test-repo",
            nameWithOwner: "small-user/test-repo",
            isPrivate: false,
            primaryLanguage: {
              name: "TypeScript",
              color: "#3178c6",
            },
            owner: {
              login: "small-user",
            },
          },
          contributions: {
            totalCount: 5,
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: [
              {
                commitCount: 2,
                occurredAt: "2023-01-05T00:00:00Z",
              },
              {
                commitCount: 3,
                occurredAt: "2023-01-06T00:00:00Z",
              },
            ],
          },
        },
      ],
      pullRequestContributionsByRepository: [],
      issueContributionsByRepository: [],
      pullRequestReviewContributionsByRepository: [],
    },
  },
};

export const smallProfileRepositoryDetails = [
  {
    owner: "small-user",
    repo: "test-repo",
    commits: [
      {
        sha: "a1b2c3d4",
        node_id: "C_kwDOA1b2c3",
        parents: [{ sha: "parent1" }],
        author: { login: "small-user" },
        commit: {
          author: { name: "Small User", email: "small@example.com", date: "2023-01-05T12:00:00Z" },
          message: "First commit",
        },
        files: [
          { filename: "src/index.ts", additions: 10, deletions: 2, status: "added" },
          { filename: "package.json", additions: 5, deletions: 0, status: "added" },
        ],
      },
      {
        sha: "e5f6g7h8",
        node_id: "C_kwDOe5f6g7",
        parents: [{ sha: "parent1" }],
        author: { login: "small-user" },
        commit: {
          author: { name: "Small User", email: "small@example.com", date: "2023-01-06T12:00:00Z" },
          message: "Second commit",
        },
        files: [
          { filename: "src/index.ts", additions: 5, deletions: 5, status: "modified" },
          { filename: "src/utils.ts", additions: 20, deletions: 0, status: "added" },
        ],
      },
    ],
  },
];
