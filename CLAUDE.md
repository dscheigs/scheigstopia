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
  sylva-ui/              Private, unpublished, consumed as source: shared components, the Tailwind color mapping and the typography CSS.
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

- `pnpm dev` → runs both apps side by side as separate origins: the site on :3000 and Grimoire on :3001 (the site gets `GRIMOIRE_URL=http://localhost:3001`; Grimoire still needs `apps/grimoire/.env.local`)
- `pnpm dev:site` → `nx dev scheigstopia` - the site alone on :3000
- `pnpm dev:grimoire` → `nx dev grimoire` - Grimoire dev server (needs `apps/grimoire/.env.local`)
- `nx test <project>` - Vitest for `grimoire`, `scheigstopia` and `sylva-ui` (there is no root `pnpm test`). Grimoire's database tests run on in-process Postgres; its `*.test.tsx` component tests run in jsdom, all others in node
- `nx storybook sylva-ui` - Storybook for `sylva-ui` on :6006 (components, class-string primitives, icons, the Colors and Typography pages; a toolbar toggle switches light and dark). `nx build-storybook sylva-ui` writes the static site to `packages/sylva-ui/storybook-static` (git-ignored)
- `pnpm build` → `nx build scheigstopia` - production build
- `pnpm start` → `nx start scheigstopia` - serve the production build
- `pnpm lint` → `nx run-many -t lint` - ESLint across all projects
- `pnpm type-check` → `nx run-many -t typecheck` - `tsc --noEmit` across all projects
- `pnpm format` / `pnpm format:check` - Prettier
- `pnpm graph` - open the Nx project graph
- `nx affected -t build build-storybook lint typecheck test` - only what the current changes touch
- `nx <target> <project>` - a single target for one project

Nx caches `build`, `lint`, `typecheck` locally — a repeat run with no relevant
changes is a near-instant cache hit.

This Next.js version has breaking changes. Each app's `AGENTS.md` (written by
`next dev`) says to read the bundled docs in `node_modules/next/dist/docs/` before
writing Next code; do that rather than relying on memory of older versions.

## Code Quality & Git Workflow

- **Package manager**: pnpm only. `packageManager` pins the version; `.npmrc` adds a
  24h `minimum-release-age` supply-chain guard and disables pnpm self-management.
  New dependency build scripts are blocked until added to `allowBuilds` in
  `pnpm-workspace.yaml`.
- **Pre-commit hook**: `lint-staged` runs Prettier on staged files.
- **File names**: camelCase for modules, hooks and their tests (`cardSearch.ts`,
  `useCardScanner.ts`, `cardNamesLib.mjs`); PascalCase for React components
  (`ScanCard.tsx`). No kebab-case module files. Leave names a tool requires alone
  (`next-auth.d.ts`, `eslint.config.mjs`, `next.config.*`, `tsconfig*.json`,
  `vitest.config.*`). Nx target names stay kebab-case (`check-card-names`).
- **Commit messages**: conventional commit format enforced by `.husky/commit-msg` —
  `<type>: <description>`, type ∈ feat, fix, docs, style, refactor, test, chore,
  perf, ci, build, revert.
- **CI**: `.github/workflows/ci.yml` runs on every PR and push to `main`:
  `nx affected -t lint typecheck build build-storybook test`, then `pnpm format:check`. Node comes
  from `.nvmrc`. Run the same targets locally before opening a PR.
- **Versions**: a PR that changes an app bumps that app's `package.json` version in
  its own `chore(release): bump <app> to X.Y.Z` commit (patch for `fix`, `refactor`
  and `perf`, minor for `feat`). `docs`, `chore`, `ci`, `test` and `style` changes
  do not bump.

## Architecture (apps/scheigstopia)

- **App Router**: layouts and pages in `apps/scheigstopia/src/app/`
- **Styling**: Tailwind CSS with CSS custom properties for theming (Inter & JetBrains Mono). Colors come from Sylva (see `docs/design.md`); `nx dev` and `nx build` build Sylva first.
- **Analytics**: Vercel Web Analytics and Speed Insights (`<Analytics />` and `<SpeedInsights />` in the root layout). They only collect once switched on for the project in the Vercel dashboard, and only on Vercel deployments. Grimoire has none: it is private and signed-in only.
- **TypeScript**: strict mode; path alias `@/*` → `apps/scheigstopia/src/*`
- **Import aliases**: use `@/` for imports within the app's src

## Architecture (apps/grimoire)

- **Auth**: Auth.js (`next-auth` v5 beta) with GitHub, restricted to `ALLOWED_GITHUB_ID`. Route handlers check the session themselves; there is no middleware.
- **Data**: Neon Postgres via `@neondatabase/serverless`. Query code takes a `Sql` function so tests can run it against PGlite. Schema changes are new files in `apps/grimoire/db/migrations/`.
- **Client data**: TanStack Query. Components never call `fetch`; they use the hooks in `src/lib/queries.ts`, which go through `apiFetch` (`src/lib/apiClient.ts`). A 401 on any request redirects to `/signin` from the `QueryClient` in `Providers.tsx`.
- **Card list**: `apps/grimoire/public/data/card-names.json` is committed (built from Scryfall by `nx run grimoire:card-names`, refreshed by hand). The build fails if it is missing or not a real build. It is the seed and fallback: the weekly workflow publishes the live list to a public Vercel Blob (`publishCardNames.mjs`), and the app reads it from `NEXT_PUBLIC_CARD_NAMES_URL` when set.
- **Scanning**: `POST /api/identify` (`src/lib/identify.ts`) sends a phone photo to Claude vision and returns the card name; the client matches it to the card list and the user confirms. It returns the name plus the model's own `high`/`low` confidence. Off unless `ANTHROPIC_API_KEY` is set. Every scan costs money: use a dedicated key with a workspace spend limit (the provider-side cap, still open in #43). The route also enforces per-user caps per minute, day and month (`src/lib/identifyLimits.ts`, counted in the `identify_log` table, overridable with `IDENTIFY_LIMIT_PER_MINUTE|DAY|MONTH`) and answers 429 past them.
- **Capture and scan queue**: the camera auto-captures when a card sits still in front of it (`autoCapture.ts`, thresholds in one `AUTO_CAPTURE` config, tuned with `TuningPanel.tsx`), with an optional OpenCV rectangle check (`cardShape.ts` holds the geometry, `cardShapeOpenCv.ts` the wasm finder, loaded lazily). Captures go into a client-side queue (`scanQueueStore.ts`: Zustand persisted to IndexedDB, one per user). `scanQueueWorker.ts` sends queued photos to `/api/identify` in the background, matches the name to the card list, and retries network failures and 429s with backoff instead of recording a no-match. Flagged items wait in the review list (`QueueView`, `queueReview.ts`) until the user confirms or renames them.
- **Offline and install**: Grimoire is an installable PWA. `public/sw.js` (registered by `PwaSetup` through `offlineCache.ts`) caches the app shell and the collection list, the manifest is at `src/app/manifest.ts`, and `persistentStorage.ts` asks the browser not to evict the scan queue and card list. In the installed iPhone app a download link opens a preview with no way back, so exports go through the system share sheet (`shareExport.ts`, `ExportLink`).
- **Separate origins**: Grimoire is its own Vercel project on its own subdomain; there is no shared path, proxy or base path. The site reads `GRIMOIRE_URL` (Grimoire's origin) to link to it and to redirect the old `/grimoire` path there (`apps/scheigstopia/src/grimoire.ts`); unset, it does neither. Sessions and storage are per origin, so Grimoire's Auth.js callback and PWA are registered on its own domain.
- **Deploys**: manual, via the _Deploy to production_ workflow (pick an app or `all`). Each app has a `production-<app>` GitHub environment holding its Vercel secrets.
- **Storybook**: `sylva-ui`'s Storybook is its own Vercel project (`sylva-ui`, Root Directory `packages/sylva-ui`, config in `packages/sylva-ui/vercel.json`), deployed by Vercel's Git integration: `main` deploys automatically and every PR gets a preview URL. It is not part of the _Deploy to production_ workflow. The `ignoreCommand` skips builds whose last commit does not touch `packages/sylva-ui`, `packages/sylva` or the root package, lockfile and workspace files, and a header keeps it out of search engines. The project holds no environment variables or secrets and must not get any, since PR previews build unreviewed code.
- **Styling**: same Tailwind setup and typography/color rules as the site. `globals.css` imports `@scheigs/sylva-ui/css` (`nx dev` and `nx build` build Sylva first). Buttons, inputs, icons and the header links come from `@scheigs/sylva-ui`.

## Design (colors and typography)

Read [`docs/design.md`](docs/design.md) before touching styles or UI. It covers the
Sylva color system, the typography classes and the minimal-color philosophy.

Shared UI lives in `packages/sylva-ui` (`@scheigs/sylva-ui`). Apps import the shared
color mapping, typography CSS, class strings (`buttonClasses`, `inputClasses`), icons
(`Check`, `Pencil`, `X`, ...) and `GnomeIcon` from it, never from `lucide-react`
directly. Add a component there when a second app needs it, not before. Only apps may
import it, and it may only import Sylva (`@nx/enforce-module-boundaries`).

Both apps render `SiteHeader`: the gnome (always a plain `<a>` to `/`), the app name,
and the app's own nav items, passed in as props. A nav item is a plain `<a>` unless it
sets `sameApp`; links to another app must never be `next/link` (client navigation hangs
between apps).

**Hard rule: never hard-code a design value in app code.** No hex/rgb/hsl colors, no
Tailwind arbitrary colors or sizes (`bg-[#1b5e20]`, `text-[13px]`), no raw font sizes.
Use the Sylva-mapped color classes and the `text-*` typography classes; if the value
you need is missing, add the token or class first and say so in the PR.

## Working with Nx

- Run tasks through `nx` (`nx run`, `nx run-many`, `nx affected`), not the underlying tool directly, so caching applies.
- Prefix with the package manager: `pnpm nx build`.
- Check `nx <command> --help` rather than guessing flags.
- Add plugins with `nx add <plugin>` so the init generator runs.
