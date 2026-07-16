

export const identity = {
  login: "test-lock-heavy",
  internalId: "U_lockheavy",
};

export const collection = {
  commits: [{
    id: "C_1",
    repositoryId: "R_1",
    occurredAt: "2023-05-01T12:00:00Z",
    message: "chore: update dependencies",
    url: "https://github.com/test-lock-heavy/repo/commit/1",
  }],
  pullRequests: [],
  reviews: [],
  issues: [],
  discussions: [],
};

export const repository = {
  id: "R_1",
  owner: "test-lock-heavy",
  name: "lock-repo",
  isPrivate: false,
  isFork: false,
  primaryLanguage: "TypeScript",
  languages: [
    { name: "TypeScript", color: "#2b7489", size: 1000 },
    { name: "JSON", color: "#000000", size: 500000 } // Huge package-lock.json
  ],
};

export const commitFiles = {
  items: [
    { path: "src/index.ts", additions: 5, deletions: 2 },
    { path: "package.json", additions: 1, deletions: 1 },
    { path: "package-lock.json", additions: 15000, deletions: 12000 },
  ],
  pageInfo: { hasNextPage: false },
};
