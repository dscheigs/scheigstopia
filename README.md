# scheigstopia

An Nx monorepo (pnpm workspaces).

## Contents

| Path                | What                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `apps/scheigstopia` | Personal site — Next.js 15, App Router, TypeScript, Tailwind.                                                               |
| `apps/grimoire`     | Grimoire — private card collection tracker (Next.js 15, Auth.js, Neon Postgres). See its [README](apps/grimoire/README.md). |
| `packages/sylva`    | Sylva — color system as W3C design tokens, built to CSS/JS. See its [README](packages/sylva/README.md).                     |

## Getting started

```bash
pnpm install
pnpm dev            # runs apps/scheigstopia on http://localhost:3000
pnpm dev:grimoire   # runs apps/grimoire (needs apps/grimoire/.env.local)
```

Grimoire needs a database and GitHub OAuth credentials before it will run; the setup steps are in its [README](apps/grimoire/README.md).

## Common commands

```bash
pnpm build                          # build the site
nx test grimoire                    # Grimoire's Vitest suite
pnpm lint                           # eslint, all projects
pnpm type-check                     # tsc --noEmit, all projects
pnpm graph                          # Nx project graph
nx affected -t build lint typecheck # only what changed
```

Requires Node 22 and pnpm (the `packageManager` field pins the version).
