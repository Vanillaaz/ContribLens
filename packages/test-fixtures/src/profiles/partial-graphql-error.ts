

export const identity = {
  login: "test-partial-error",
  internalId: "U_partial",
};

export const collection = {
  commits: [{
    id: "C_1",
    repositoryId: "R_1",
    occurredAt: "2023-05-01T12:00:00Z",
    message: "feat: something",
    url: "https://github.com/test-partial-error/repo/commit/1",
  }],
  pullRequests: [],
  reviews: [],
  issues: [],
  discussions: [],
  hasNextPage: true, // But we simulate failure on the next page
};

export const repository = {
  id: "R_1",
  owner: "test-partial-error",
  name: "repo",
  isPrivate: false,
  isFork: false,
  primaryLanguage: "JavaScript",
  languages: [
    { name: "JavaScript", color: "#f1e05a", size: 1000 },
  ],
};
