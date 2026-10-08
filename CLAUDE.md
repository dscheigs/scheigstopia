# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Nx monorepo** (pnpm workspaces). It contains the Scheigstopia personal
site (`apps/scheigstopia`) and Grimoire (`apps/grimoire`), a private Magic: The
Gathering collection tracker. Both are Next.js 15 App Router apps with TypeScript
and Tailwind CSS. More apps and shared packages (`packages/*`) will be added over time.

## Workspace layout

```
apps/
  scheigstopia/          Next.js 15 site (App Router). Its own tsconfig, eslint, next config.
  grimoire/              Next.js 15 collection tracker (Auth.js, Neon Postgres). See its README.
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
- **Styling**: Tailwind CSS with CSS custom properties for theming (Inter & JetBrains Mono). Colors come from Sylva (see Color System); `nx dev` and `nx build` build Sylva first.
- **TypeScript**: strict mode; path alias `@/*` → `apps/scheigstopia/src/*`
- **Import aliases**: use `@/` for imports within the app's src

## Architecture (apps/grimoire)

- **Auth**: Auth.js (`next-auth` v5 beta) with GitHub, restricted to `ALLOWED_GITHUB_ID`. Route handlers check the session themselves; there is no middleware.
- **Data**: Neon Postgres via `@neondatabase/serverless`. Query code takes a `Sql` function so tests can run it against PGlite. Schema changes are new files in `apps/grimoire/db/migrations/`.
- **Card list**: `apps/grimoire/public/data/card-names.json` is committed (built from Scryfall by `nx run grimoire:card-names`, refreshed by hand). The build fails if it is missing or not a real build.
- **Deploys**: manual, via the _Deploy to production_ workflow (pick an app or `all`). Each app has a `production-<app>` GitHub environment holding its Vercel secrets.
- **Styling**: same Tailwind setup and typography/color rules as the site (its CSS files are copies).

## No stray values (hard rule)

Never hard-code a design value in app code:

- No hex, rgb or hsl colors, and no Tailwind arbitrary colors like `bg-[#1b5e20]`.
- No raw font sizes (px, rem, clamp) and no arbitrary sizes like `text-[13px]`.

Colors come from Sylva tokens through the Tailwind classes mapped to them (see Color
System). Type comes from the typography classes below. If the value you need doesn't
exist, add the token or class first and say so in the PR; don't hard-code around it.

Exceptions, until the color audit retires them: the six site-only colors in
`apps/scheigstopia/src/styles/colors.css` (listed under Color System), and Grimoire's
copied CSS until it moves to Sylva (#32). Sylva's token files are where values are
defined. This file states the rule; a CI check to enforce it is planned (#49), and
until then it is enforced in review.

## Typography System

The project uses custom typography classes with responsive clamp() sizing. **ALWAYS use these classes instead of Tailwind's default text sizing:**

### Typography Classes (Required Usage)

- `text-hero` - Largest text for hero sections (40-60px, bold)
- `text-page-title` - Page titles (32-48px, bold)
- `text-section-title` - Major section headings (28-36px, semibold)
- `text-heading` - Standard headings (24-30px, semibold)
- `text-subheading` - Subheadings (20-24px, medium)
- `text-lead` - Introduction/lead paragraphs (18-20px, normal)
- `text-body` - Regular body text (14-16px, normal)
- `text-caption` - Small text, captions, metadata (13-14px, light)

### Fonts

- **Sans-serif**: Inter (main font)
- **Monospace**: JetBrains Mono (code blocks)

### CSS Organization

- `apps/scheigstopia/src/styles/globals.css` - Main imports and body styles
- `apps/scheigstopia/src/styles/colors.css` - Color system and variables
- `apps/scheigstopia/src/styles/typography.css` - Font system and typography classes

## Color System & Design Philosophy

### Where the values come from

`colors.css` imports Sylva (`@scheigs/sylva/css`) and points the site's variable
names at Sylva tokens wherever the colors match exactly: background, foreground,
the primary/accent greens, the neutral scale, the minimal surface colors and
success/warning/error. These are still literal values, because Sylva has no
matching token yet: `--surface`, `--surface-hover`, `--border`, `--muted`,
`--accent-muted`, `--accent-muted-hover`. To change a shared color, edit Sylva's
tokens rather than `colors.css`. Keep the variable names; the Tailwind classes below
depend on them.

The project follows a **minimalistic color approach** with strategic use of color:

### Design Philosophy

- **Minimal body colors**: Content areas (cards, modals, forms) use neutral black/white/gray colors
- **Accent colors for navigation**: Headers, navigation, and primary actions use the green theme
- **Clean contrast**: High contrast between text and backgrounds for readability
- **Consistent neutrals**: Use the defined neutral scale for all non-accent elements

### Color Usage Guidelines

**ALWAYS use these neutral colors for content:**

- `bg-surface-minimal` - Main surface backgrounds (cards, modals)
- `bg-surface-minimal-hover` - Hover states for surfaces
- `border-border-minimal` - Borders for content containers
- `text-text-minimal` - Subdued text (descriptions, secondary content)
- `bg-neutral-*` classes - For buttons, tags, and UI elements

**Use theme colors ONLY for:**

- Navigation headers
- Primary action buttons
- Active states in navigation
- Brand elements

### Available Neutral Colors

```css
--neutral-50: #fafafa (lightest) --neutral-100: #f5f5f5 --neutral-200: #e5e5e5
    --neutral-300: #d4d4d4 --neutral-400: #a3a3a3 --neutral-500: #737373
    --neutral-600: #525252 --neutral-700: #404040 --neutral-800: #262626
    --neutral-900: #171717 --neutral-950: #0a0a0a (darkest);
```

### Semantic Color Variables

- `--surface-minimal` - Auto-adjusting surface for light/dark mode
- `--surface-minimal-hover` - Hover state for minimal surfaces
- `--border-minimal` - Neutral borders
- `--text-minimal` - Subdued text color

**Example Usage:**

```tsx
// ✅ Good - Content with minimal colors
<div className="bg-surface-minimal border border-border-minimal">
  <p className="text-text-minimal">Description text</p>
  <button className="bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900">
    Action
  </button>
</div>

// ❌ Avoid - Using theme colors for content
<div className="bg-surface border border-border">
  <p className="text-muted">Description text</p>
</div>
```

## Working with Nx

- Run tasks through `nx` (`nx run`, `nx run-many`, `nx affected`), not the underlying tool directly, so caching applies.
- Prefix with the package manager: `pnpm nx build`.
- Check `nx <command> --help` rather than guessing flags.
- Add plugins with `nx add <plugin>` so the init generator runs.
