# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Nx monorepo** (pnpm workspaces). It contains the Scheigstopia personal
site (`apps/scheigstopia`) and Grimoire (`apps/grimoire`), a private Magic: The
Gathering collection tracker. Both are Next.js 16 App Router apps with TypeScript
and Tailwind CSS. More apps and shared packages (`packages/*`) will be added over time.

## Workspace layout

```
apps/
  scheigstopia/          Next.js 16 site (App Router). Its own tsconfig, eslint, next config.
  grimoire/              Next.js 16 collection tracker (Auth.js, Neon Postgres). See its README.
packages/
  sylva/                 Sylva color system (W3C design tokens -> CSS/JS). `nx build sylva` generates dist/ (git-ignored).
tsconfig.base.json       Compiler options every project's tsconfig extends.
eslint.config.mjs        Flat ESLint base; project configs import and extend it.
nx.json                  Nx plugins (@nx/next, @nx/eslint) + target defaults.
pnpm-workspace.yaml      Workspace globs + vetted build-script allowlist.
```

Dependencies live in the **root `package.json`**. Apps do not carry their own deps;
publishable packages will. A workspace package an app uses is a root dependency
(`"workspace:*"`) plus an `implicitDependencies` entry in the app's `project.json`,
so Nx builds the package first (CSS imports are invisible to Nx's import scan).

## Development Commands

Run from the repo root. Root scripts wrap Nx; you can also call Nx directly.

- `pnpm dev` → `nx dev scheigstopia` - dev server (Turbopack) on :3000
- `pnpm dev:grimoire` → `nx dev grimoire` - Grimoire dev server (needs `apps/grimoire/.env.local`)
- `nx test grimoire` - Grimoire's Vitest suite (database tests run on in-process Postgres)
- `pnpm build` → `nx build scheigstopia` - production build
- `pnpm start` → `nx start scheigstopia` - serve the production build
- `pnpm lint` → `nx run-many -t lint` - ESLint across all projects
- `pnpm type-check` → `nx run-many -t typecheck` - `tsc --noEmit` across all projects
- `pnpm format` / `pnpm format:check` - Prettier
- `pnpm graph` - open the Nx project graph
- `nx affected -t build lint typecheck test` - only what the current changes touch
- `nx <target> <project>` - a single target for one project

Nx caches `build`, `lint`, `typecheck` locally — a repeat run with no relevant
changes is a near-instant cache hit.

## Code Quality & Git Workflow

- **Package manager**: pnpm only. `packageManager` pins the version; `.npmrc` adds a
  24h `minimum-release-age` supply-chain guard and disables pnpm self-management.
  New dependency build scripts are blocked until added to `allowBuilds` in
  `pnpm-workspace.yaml`.
- **Pre-commit hook**: `lint-staged` runs Prettier on staged files.
- **Commit messages**: conventional commit format enforced by `.husky/commit-msg` —
  `<type>: <description>`, type ∈ feat, fix, docs, style, refactor, test, chore,
  perf, ci, build, revert.

## Architecture (apps/scheigstopia)

- **App Router**: layouts and pages in `apps/scheigstopia/src/app/`
- **Styling**: Tailwind CSS with CSS custom properties for theming (Inter & JetBrains Mono). Colors come from Sylva (see `docs/design.md`); `nx dev` and `nx build` build Sylva first.
- **TypeScript**: strict mode; path alias `@/*` → `apps/scheigstopia/src/*`
- **Import aliases**: use `@/` for imports within the app's src

## Architecture (apps/grimoire)

- **Auth**: Auth.js (`next-auth` v5 beta) with GitHub, restricted to `ALLOWED_GITHUB_ID`. Route handlers check the session themselves; there is no middleware.
- **Data**: Neon Postgres via `@neondatabase/serverless`. Query code takes a `Sql` function so tests can run it against PGlite. Schema changes are new files in `apps/grimoire/db/migrations/`.
- **Client data**: TanStack Query. Components never call `fetch`; they use the hooks in `src/lib/queries.ts`, which go through `apiFetch` (`src/lib/api-client.ts`). A 401 on any request redirects to `/signin` from the `QueryClient` in `Providers.tsx`.
- **Card list**: `apps/grimoire/public/data/card-names.json` is committed (built from Scryfall by `nx run grimoire:card-names`, refreshed by hand). The build fails if it is missing or not a real build.
- **Scanning**: `POST /api/identify` (`src/lib/identify.ts`) sends a phone photo to Claude vision and returns the card name; the client matches it to the card list and the user confirms. Off unless `ANTHROPIC_API_KEY` is set. Every scan costs money: before enabling it in production use a dedicated key with a workspace spend limit. The app-side cap and rate limits (#43) are needed before auto-capture.
- **Deploys**: manual, via the _Deploy to production_ workflow (pick an app or `all`). Each app has a `production-<app>` GitHub environment holding its Vercel secrets.
- **Styling**: same Tailwind setup and typography/color rules as the site. Its `colors.css` imports Sylva like the site's (`nx dev` and `nx build` build Sylva first); `typography.css` is a copy.

## Design (colors and typography)

Read [`docs/design.md`](docs/design.md) before touching styles or UI. It covers the
Sylva color system, the typography classes and the minimal-color philosophy.

**Hard rule: never hard-code a design value in app code.** No hex/rgb/hsl colors, no
Tailwind arbitrary colors or sizes (`bg-[#1b5e20]`, `text-[13px]`), no raw font sizes.
Use the Sylva-mapped color classes and the `text-*` typography classes; if the value
you need is missing, add the token or class first and say so in the PR.

## Working with Nx

- Run tasks through `nx` (`nx run`, `nx run-many`, `nx affected`), not the underlying tool directly, so caching applies.
- Prefix with the package manager: `pnpm nx build`.
- Check `nx <command> --help` rather than guessing flags.
- Add plugins with `nx add <plugin>` so the init generator runs.
