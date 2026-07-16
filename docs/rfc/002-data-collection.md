## GitHub APIs used

The platform uses GitHub GraphQL for discovery and aggregate contribution context, then GitHub REST for file-level evidence.

| Purpose | API | Why |
|---|---|---|
| Resolve developer | GraphQL `user(login:)` | One request establishes stable user identity and contribution years. |
| Discover contribution-bearing repositories | GraphQL `User.contributionsCollection(from:, to:)` | Groups commits, pull requests, and reviews by repository for the requested person and window. |
| Discover PRs and reviews | GraphQL contribution connections, then PR details as needed | Captures person-authored collaboration activity across repositories. |
| Discover commits | REST `GET /repos/{owner}/{repo}/commits?author={login}&since=&until=` | Returns commit SHAs and metadata for a known repository, filtered by author and time range. |
| Discover changed files in a commit | REST `GET /repos/{owner}/{repo}/commits/{sha}` | Returns additions, deletions, file path, status, rename predecessor, and often patch data. |
| Discover changed files in a PR | REST `GET /repos/{owner}/{repo}/pulls/{number}/files` | Best source for a PR’s unified file list and file-level additions/deletions. |
| Repository metadata | GraphQL repository fields, supplemented by REST only if needed | Determines owner relationship, fork/archive state, default branch, visibility, and repository identity. |

GraphQL contribution collections expose commit contributions grouped by repository and support a `maxRepositories` control; their default is 25, so the implementation must request the supported maximum and record any truncation as a coverage limitation. [GitHub GraphQL user reference](https://docs.github.com/en/graphql/reference/users)

## How repositories are discovered

Repository discovery is contribution-led, not ownership-led.

### Primary discovery path

For each requested time window:

1. Resolve the GitHub user.
2. Request a GraphQL `contributionsCollection(from, to)`.
3. Collect repository references from:
   - commit contributions by repository;
   - pull-request contributions by repository;
   - pull-request-review contributions by repository;
   - issue and discussion contribution records where exposed.
4. Deduplicate by immutable repository node ID, not by `owner/name`.
5. Classify each repository:
   - owned by the subject;
   - organization-owned;
   - externally owned;
   - unavailable/unknown.

This finds repositories in which GitHub recognizes the user’s contribution activity, including repositories they do not own.

### Supplemental discovery

Public search may be used carefully to find authored pull requests or issues that contribution collections did not expose, but it cannot be treated as complete. Search is capped, rate-limited separately, and may not reflect all historical or inaccessible activity.

### Important limitation

GitHub does not offer a public, lossless API saying: “return every repository to which this person has ever contributed, including every branch and every non-qualifying commit.” The contribution collection is the best primary index, but the result remains coverage-dependent.

The confidence model must report:

- number of discovered repositories;
- truncated discovery indicators;
- repositories no longer accessible;
- activity types with no repository-level evidence.

## How commits are discovered

There are two distinct layers.

### Contribution-level discovery

GraphQL identifies that the developer contributed commits in a repository and time window. This is sufficient for contribution counts and repository discovery.

### Commit-level evidence

For repositories requiring code and language analytics, call:

`GET /repos/{owner}/{repo}/commits?author={login}&since={UTC}&until={UTC}`

The result provides commit SHAs, author/committer metadata, commit messages, and timestamps. GitHub supports author, time-window, and pagination filters; the default traversal begins from the repository’s default branch unless a ref is supplied. [GitHub commit API](https://docs.github.com/en/rest/commits/commits)

### Commit reconciliation rules

- Use GraphQL contribution totals as the activity baseline.
- Use REST-discovered commits as file-level evidence.
- Deduplicate by repository ID + commit SHA.
- Prefer PR file data for commits belonging to an authored PR, so the same change is not counted both as PR work and commit work.
- Preserve commit counts even when changed-file inspection is incomplete.
- Mark code/language analytics partial when commit evidence cannot be reconstructed.

### Why this separation matters

A developer can have a GitHub-recognized commit contribution without the service being able to inspect every underlying file change—for example, because the repository is now private, deleted, inaccessible, or because the commit is no longer reachable from the default branch.

## How changed files are discovered

### Preferred path: authored pull requests

For each discovered authored PR, call:

`GET /repos/{owner}/{repo}/pulls/{pull_number}/files`

This returns file path, status, additions, deletions, and rename information. It is the preferred evidence because it describes the entire submitted change set and avoids branch traversal ambiguity.

The endpoint is paginated and caps a PR response at 3,000 files. Hitting that cap must lower confidence. [GitHub pull-request files API](https://docs.github.com/en/rest/pulls/pulls)

### Fallback path: individual commits

For qualifying commits not represented by an authored PR, call:

`GET /repos/{owner}/{repo}/commits/{sha}`

This returns changed files with path, status, additions, deletions, and, where available, a textual patch. For more than 300 files, GitHub provides paginated file lists up to 3,000 files. Large diff requests can time out, and binary files may not include patches. [GitHub commit detail API](https://docs.github.com/en/rest/commits/commits)

### No full-history cloning in MVP

The service should not clone repositories in Version 1.

**Why:** Cloning is slow, expensive, operationally complex, can expose more repository contents than needed, and still cannot solve access limitations. GitHub API evidence is the appropriate bounded source for an on-demand public service.

## How rate limits are avoided

The design avoids rate limits through staged retrieval, not by retrying harder.

### Retrieval hierarchy

1. Serve a CDN-cached response when fresh.
2. Use one compact GraphQL discovery query.
3. Calculate contribution-count analytics immediately.
4. Fetch file details only for repositories/PRs/commits needed for code and language estimates.
5. Stop enrichment when confidence is already adequate or the query budget is exhausted.
6. Return a partial result rather than consuming unlimited requests.

### Concrete controls

- Bound concurrent GitHub requests per process.
- Maintain a per-request API cost budget.
- Use GraphQL batching for repository and contribution metadata.
- Use REST only after GraphQL narrows the candidate set.
- Paginate only while results remain in the requested time window.
- Deduplicate PRs, commits, repositories, and retries.
- Cache complete HTTP responses at the CDN.
- Use conditional HTTP requests/ETags where GitHub supports them.
- Apply per-IP and per-login refresh limits.
- Respect `x-ratelimit-remaining`, `x-ratelimit-reset`, and `Retry-After`.
- Exponential backoff with jitter for transient errors.
- Stop enrichment and return `partial` before upstream quota is exhausted.

GitHub applies GraphQL point budgets, separate REST budgets, secondary limits, concurrency limits, and resource constraints. The platform must read response headers and adapt rather than assume a fixed safe request count. [GitHub GraphQL rate limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)

## Data that can never be obtained reliably

| Unobtainable or unreliable data | Reason |
|---|---|
| Private repository data in Version 1 | MVP has no user authorization and must not access private content. |
| Repositories the caller cannot access | GitHub does not expose their commits, PR files, or source contents. |
| Deleted repositories, deleted branches, and garbage-collected commits | The underlying objects may no longer exist or be reachable. |
| Every historical commit attributable to a login | Commit identity is email-based; unlinked, altered, or missing author identities cannot be reliably mapped to an account. |
| All commits on all branches | Repository commit listing defaults to the default branch; arbitrary branch enumeration is incomplete and expensive. |
| Local, unpushed, squashed-away, rebased-away, or externally hosted work | GitHub has no surviving public object to inspect. |
| A person’s exact authored line count | Renames, copied code, pair programming, generated files, formatting, merges, and squashes prevent defensible precision. |
| True semantic ownership of code | Git history shows changes, not who originally designed, wrote, reviewed, or materially influenced code. |
| Whether a contribution was valuable, difficult, paid, volunteer, or high impact | GitHub activity is not a measure of engineering value. |
| Perfect generated/vendor/formatting detection | Repository conventions and tool output vary; API patches can be missing or truncated. |
| Private contribution details merely because a profile shows a private-count indicator | GitHub may expose a count but not the associated repositories or objects. |

GitHub itself applies eligibility conditions to profile contributions, so its contribution count and inspectable source objects are not identical datasets. [GitHub contribution reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)

## Required heuristics

Heuristics are used only for **qualified authored-change** and **language** estimates. They must not alter raw activity counts.

Each decision records a rule ID, reason, and certainty: `included`, `excluded`, or `indeterminate`.

### File-path and file-type heuristics

- Exclude standard dependency lock files:
  - `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`;
  - `poetry.lock`, `Pipfile.lock`;
  - `Gemfile.lock`, `Cargo.lock`;
  - equivalent ecosystem lock files.
- Exclude known dependency/vendor paths:
  - `vendor/`, `node_modules/`, `third_party/`, `external/`;
  - language-specific package/cache directories.
- Exclude common generated paths:
  - `dist/`, `build/`, `coverage/`, generated API clients, compiled assets;
  - configurable project-specific patterns.
- Exclude minified bundles using file suffix and content-shape heuristics.
- Classify documentation and configuration separately from executable source.
- Treat unknown extension/content as `unknown`, not as a guessed language.

### Rename heuristics

- `renamed` with zero additions/deletions: exclude from qualified code volume.
- Rename with changes: count only the reported content changes.
- Rename detection unavailable: mark confidence lower rather than assuming newly authored content.

### Formatting-only heuristics

A commit or file is likely formatting-only when all apply:

- no meaningful token changes after normalizing whitespace;
- no additions/removals beyond line wrapping, indentation, blank lines, or formatter signatures;
- only formatting/config files changed, or patch shape matches known formatter output;
- no semantic file rename/add/delete signal.

Formatting-only changes remain visible as activity, but contribute zero to qualified code volume and personal language volume.

This must be labeled heuristic—not fact—because whitespace normalization cannot perfectly preserve semantics across all languages.

### Generated-code heuristics

Use layered evidence:

1. repository path patterns;
2. file-name suffix patterns;
3. recognized generated-file header comments;
4. low-entropy/minified content patterns;
5. project configuration where recognizable.

If evidence conflicts, classify as `indeterminate` rather than exclude automatically.

### Commit and PR attribution heuristics

- Prefer authored PR file lists over the union of its commits.
- Deduplicate commit SHAs that appear in multiple discovery paths.
- Do not attribute merge commits to the merger as authored source changes by default.
- Do not infer co-authorship from commit messages unless a future version explicitly supports verified co-author trailers.
- Preserve separate metrics for authored PRs, merged PRs, reviews, issues, and qualified code changes.
- Do not use repository-wide language percentages for personal language analytics.

### Confidence heuristics

Lower confidence when:

- repository discovery is capped or incomplete;
- a relevant repository is inaccessible/deleted;
- PR/commit file lists exceed API limits;
- patches are absent, binary, or timed out;
- a large portion of change volume is unknown or indeterminate;
- a requested time window cannot be fully paginated;
- GitHub returns partial GraphQL errors or rate-limit deferrals.

The resulting design gives a useful answer when evidence exists, while making the boundary of that answer explicit.