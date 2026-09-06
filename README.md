# scheigs

An Nx monorepo (pnpm workspaces).

## Contents

| Path                | What                                                          |
| ------------------- | ------------------------------------------------------------- |
| `apps/scheigstopia` | Personal site — Next.js 15, App Router, TypeScript, Tailwind. |
| `packages/`         | Shared, publishable packages (none yet).                      |

## Getting started

```bash
pnpm install
pnpm dev            # runs apps/scheigstopia on http://localhost:3000
```

## Common commands

```bash
pnpm build                          # build the site
pnpm lint                           # eslint, all projects
pnpm type-check                     # tsc --noEmit, all projects
pnpm graph                          # Nx project graph
nx affected -t build lint typecheck # only what changed
```

Requires Node 22 and pnpm (the `packageManager` field pins the version).
