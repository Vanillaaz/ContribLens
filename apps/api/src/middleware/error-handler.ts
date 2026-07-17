import type { ErrorHandler } from "hono";
import { isAnalyticsError } from "@ContribLens/domain";
import type { ProblemDetails } from "@ContribLens/api-contracts";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  let status = 500;
  const problem: ProblemDetails = {
    type: "https://ContribLens.io/errors/internal-server-error",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred while processing the request.",
  };

  if (err instanceof ZodError) {
    status = 400;
    problem.type = "https://ContribLens.io/errors/validation-failed";
    problem.title = "Validation Failed";
    problem.status = 400;
    problem.detail = "One or more fields failed validation.";

    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_root";
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }
    problem.errors = errors;
  } else if (isAnalyticsError(err)) {
    status = err.code === "USER_NOT_FOUND" ? 404
      : err.code === "UPSTREAM_RATE_LIMITED" ? 429
        : 500;

    problem.type = `https://ContribLens.io/errors/${err.code.toLowerCase().replace(/_/g, "-")}`;
    problem.title = "Analytics Error";
    problem.status = status;
    problem.detail = err.message;
  } else {
    // Log unexpected errors
    console.error("Unhandled API Error:", err);
  }

  return c.json(problem, status as any);
};
