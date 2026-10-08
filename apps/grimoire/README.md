# Grimoire

A private Magic: The Gathering collection tracker. Phone-friendly, signed in with GitHub, with the collection saved in a Neon Postgres database so it survives a phone reset and works across devices.

This is milestone 1 of the plan: sign-in, database, the card list, and a collection you can search, add to, edit, and export. Camera scanning comes next.

## What's here

- **Sign-in**: GitHub through Auth.js, restricted to one GitHub account (`ALLOWED_GITHUB_ID`). Every API route checks the session itself.
- **Collection**: add a card by typing its name (fuzzy search), change quantities, remove cards, filter the list, export as `4 Lightning Bolt` text for Moxfield or Archidekt.
- **Card list**: `public/data/card-names.json`, built from Scryfall's Oracle Cards bulk data by `scripts/build-card-names.mjs`. Tokens, emblems, and art-series cards are left out.
- **Data**: users and collection tables in `db/migrations`. Cards are keyed by Scryfall `oracle_id`; everything is keyed to an internal user id, not the GitHub id, so other sign-in methods can be added later.

## First-time setup

1. **Database.** Add Neon Postgres to a Vercel project through the Vercel Marketplace (or create a Neon project directly) and copy the connection string.
2. **GitHub OAuth apps.** In GitHub, go to Settings -> Developer settings -> OAuth Apps and create two apps:

    - Production: callback URL `https://<your-grimoire-domain>/api/auth/callback/github`
    - Local: callback URL `http://localhost:3000/api/auth/callback/github`

    GitHub allows one callback per app, which is why there are two.

3. **Your GitHub user id.** Open `https://api.github.com/users/<your-username>` and copy the numeric `id`.
4. **Environment variables.** Copy `.env.example` to `apps/grimoire/.env.local` for local work, and set the same names in Vercel for production. Generate `AUTH_SECRET` with `npx auth secret` or `openssl rand -base64 32`.
5. **Create the tables.** `pnpm nx run grimoire:migrate` (reads `apps/grimoire/.env.local` if present).
6. **Build the card list.** `pnpm nx run grimoire:card-names` downloads Scryfall's Oracle Cards file (about 150 MB) and writes the slim list. Offline, use the sample file instead:
   `node apps/grimoire/scripts/build-card-names.mjs --fixture apps/grimoire/fixtures/oracle-cards.sample.json`
7. **Run it.** `pnpm dev:grimoire`, then open http://localhost:3000.

## Deploying to Vercel

Create a separate Vercel project for this app with **Root Directory** set to `apps/grimoire`; `vercel.json` already sets the install and build commands. The build downloads a fresh card list, so redeploying picks up new sets.

- Auth.js trusts the host automatically on Vercel. On any other host, set `AUTH_TRUST_HOST=true`.
- GitHub sign-in only works on URLs registered as an OAuth callback. Vercel preview URLs change on every deploy, so sign in on the production URL.
- Run `pnpm nx run grimoire:migrate` against the production database once before first use, and again after any new migration.

## Commands

| Command                           | What it does                         |
| --------------------------------- | ------------------------------------ |
| `pnpm dev:grimoire`               | Dev server on :3000                  |
| `pnpm nx build grimoire`          | Production build                     |
| `pnpm nx test grimoire`           | Unit and database tests (about 10 s) |
| `pnpm nx run grimoire:migrate`    | Apply `db/migrations/*.sql`          |
| `pnpm nx run grimoire:card-names` | Rebuild the card list from Scryfall  |

## Tests

`nx test grimoire` runs Vitest. The database tests apply the real migrations to an in-process Postgres (PGlite) and exercise the real queries, including that one user can never read or change another user's cards. The sign-in gate, input validation, export format, fuzzy search, and card-list filtering have their own tests.

## Not yet done

- Camera scanning, OCR, and the Claude vision fallback (milestones 2 to 5).
- Installing as a home-screen app and requesting persistent storage.
- A cached copy of the card list in IndexedDB; for now it is fetched as a static file and cached by the browser.
