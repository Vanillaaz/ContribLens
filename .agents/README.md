# .agents

This directory is reserved for agent-driven workflow definitions — scripts or config that automated agents (CI bots, Dependabot, release automation) use to interact with this repository.

## Current contents

_Nothing here yet._ Future candidates:

- `release.md` — instructions for an agent to run `pnpm changeset version` + `pnpm changeset publish` on merge to `main`
- `dependabot.yml` guidance or overrides
- Agentic PR review config

For now, the CI pipeline lives in `.github/workflows/ci.yml`.
