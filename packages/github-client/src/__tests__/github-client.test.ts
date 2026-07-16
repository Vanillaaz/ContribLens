import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient } from "../github-client.js";

// Mock octokit and graphql
vi.mock("@octokit/graphql", () => {
  const graphqlMock = vi.fn();
  return {
    graphql: Object.assign(graphqlMock, {
      defaults: vi.fn(() => graphqlMock),
    }),
  };
});

vi.mock("@octokit/rest", () => {
  const requestMock = vi.fn();
  return {
    Octokit: vi.fn(() => ({
      request: requestMock,
    })),
  };
});

// Import them so we can assert on them
import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";

// Fix up mock types
const mockedGraphql = graphql as unknown as ReturnType<typeof vi.fn>;
// Octokit mock instance
let octokitRequestMock: ReturnType<typeof vi.fn>;

describe("GitHubClient", () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    octokitRequestMock = vi.fn();
    (Octokit as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      request: octokitRequestMock,
    }));

    client = new GitHubClient({
      token: "test-token",
      userAgent: "test-agent",
      timeoutMs: 1000,
      requestBudget: 10,
      maxRetries: 3,
      maxConcurrency: 10,
    });
  });

  describe("GraphQL", () => {
    it("should fetch user identity successfully", async () => {
      const mockResponse = { user: { login: "test" } };
      mockedGraphql.mockResolvedValueOnce(mockResponse);

      const result = await client.getUserIdentity({ login: "test" });
      expect(result).toEqual(mockResponse);
      expect(mockedGraphql).toHaveBeenCalledTimes(1);
    });

    it("should retry transient errors (HTTP 500) and eventually succeed", async () => {
      const mockResponse = { user: { login: "test" } };
      mockedGraphql
        .mockRejectedValueOnce({ status: 500, message: "Server Error" })
        .mockRejectedValueOnce({ status: 502, message: "Bad Gateway" })
        .mockResolvedValueOnce(mockResponse);

      const result = await client.getUserIdentity({ login: "test" });
      expect(result).toEqual(mockResponse);
      expect(mockedGraphql).toHaveBeenCalledTimes(3);
    });

    it("should not retry on rate limit (HTTP 429)", async () => {
      mockedGraphql.mockRejectedValueOnce({ status: 429, message: "Too Many Requests" });

      await expect(client.getUserIdentity({ login: "test" })).rejects.toEqual({
        status: 429,
        message: "Too Many Requests",
      });
      expect(mockedGraphql).toHaveBeenCalledTimes(1); // No retries
    });

    it("should not retry on forbidden (HTTP 403)", async () => {
      mockedGraphql.mockRejectedValueOnce({ status: 403, message: "Forbidden" });

      await expect(client.getUserIdentity({ login: "test" })).rejects.toEqual({
        status: 403,
        message: "Forbidden",
      });
      expect(mockedGraphql).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe("REST", () => {
    it("should fetch commits successfully and track rate limits", async () => {
      const mockResponse = {
        data: [{ sha: "123" }],
        headers: { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": "1234567890" },
      };
      octokitRequestMock.mockResolvedValueOnce(mockResponse);

      const result = await client.listCommits({ owner: "test", repo: "test" } as any);
      expect(result).toEqual([{ sha: "123" }]);
      expect(octokitRequestMock).toHaveBeenCalledTimes(1);
    });

    it("should retry transient REST errors", async () => {
      const mockResponse = {
        data: [{ sha: "123" }],
        headers: { "x-ratelimit-remaining": "4999" },
      };
      octokitRequestMock
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValueOnce(mockResponse);

      const result = await client.listCommits({ owner: "test", repo: "test" } as any);
      expect(result).toEqual([{ sha: "123" }]);
      expect(octokitRequestMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Budgeting", () => {
    it("should indicate budget is low when requests exceed limit", async () => {
      expect(client.isBudgetLow()).toBe(false);

      // Force requests Used to increase
      mockedGraphql.mockResolvedValue({ data: {} });
      for (let i = 0; i < 10; i++) {
        await client.getUserIdentity({ login: "test" });
      }

      expect(client.isBudgetLow()).toBe(true);
    });
  });
});
