# Grimoire

A private Magic: The Gathering collection tracker. Phone-friendly, signed in with GitHub, with the collection saved in a Neon Postgres database so it survives a phone reset and works across devices.

This is milestones 1 to 3 of the plan: sign-in, database, the card list, a collection you can search, add to, edit, and export, snapping a card with the camera to identify and add it, and auto-capture that snaps for you when a card is held still. The background queue and the accuracy and cost test come next.

## What's here

- **Sign-in**: GitHub through Auth.js, restricted to one GitHub account (`ALLOWED_GITHUB_ID`). Every API route checks the session itself.
- **Collection**: add a card by typing its name (fuzzy search), change quantities, remove cards, filter the list, export as `4 Lightning Bolt` text for Moxfield or Archidekt.
- **Scanning**: tap _Scan a card_, point the rear camera at one card, tap _Snap_. The phone shrinks the photo, `POST /api/identify` has Claude read the name, and the app matches it to the card list and asks _Is this ...?_ before adding anything. See [Card scanning](#card-scanning).
- **Card list**: `public/data/card-names.json`, committed to the repo and built from Scryfall's Oracle Cards bulk data by `scripts/buildCardNames.mjs`. Tokens, emblems, and other non-collectible layouts are left out. Deploys do not call Scryfall.
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
6. **Card list.** It is already committed, so there is nothing to do. See [Refreshing the card list](#refreshing-the-card-list) when a new set comes out.
7. **Run it.** `pnpm dev:grimoire`, then open http://localhost:3000.

## Card scanning

How it works:

1. The browser opens the camera with `getUserMedia` (HTTPS or `localhost` only), draws one frame to a canvas, and downsizes it to 1280 px on the long side as a JPEG (`src/lib/capture.ts`).
2. `POST /api/identify` takes the image as the request body. It checks the session, the content type, the size (1.5 MB), and that the bytes really are a JPEG, PNG or WebP, all before anything is sent to the API.
3. The server asks Claude vision for the card name and returns `{ name }`, or `{ name: null }` if the photo was not readable. The photo is never stored.
4. The browser fuzzy-matches that name against the card list and shows the best match with _Add to collection_ and _Not it_. Nothing is added without a tap.

Settings, all on the server and never sent to the browser:

| Variable                                        | What it does                                                                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                             | Turns scanning on. Unset, the route answers 503 and calls nothing.                                                                                 |
| `IDENTIFY_MODEL`                                | Model that reads the name. Defaults to the smallest (`claude-haiku-5-5`); change it without a code change.                                         |
| `IDENTIFY_LIMIT_PER_MINUTE` / `_DAY` / `_MONTH` | Scan caps per user (days and months are UTC). Past a cap the route answers 429 and calls nothing. Defaults are deliberately low: 10, 100 and 1000. |

**Every scan is a paid API call.** Before setting the key in production, use a key made just for Grimoire in an Anthropic workspace with a monthly spend limit (issue #43). That limit is the backstop. The app-side caps above sit in front of it, and auto-capture switches itself off on any failed or refused scan so it can never retry in a loop.

To try it locally, put a key in `apps/grimoire/.env.local` and run `pnpm dev:grimoire`. A phone can reach your computer's dev server over HTTPS only (for example through a tunnel), because browsers block camera access on plain HTTP.

## Deploying to Vercel

Merging to `main` does **not** deploy Grimoire (`vercel.json` turns Vercel's Git deploys off). Deploys are manual, through the **Deploy to production** workflow in GitHub Actions:

1. Actions -> Deploy to production -> Run workflow, on `main`.
2. Pick `grimoire` (or `all`) and run it. The job waits for your approval, then deploys.

One-time setup:

- Create a separate Vercel project with **Root Directory** set to `apps/grimoire`, and set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` and `ALLOWED_GITHUB_ID` on it.
- Create a GitHub environment named `production-grimoire` that only allows deployments from `main` and requires you as reviewer. Add the secrets `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` to it.
- Auth.js trusts the host automatically on Vercel. On any other host, set `AUTH_TRUST_HOST=true`.
- GitHub sign-in only works on URLs registered as an OAuth callback. Vercel preview URLs change on every deploy, so sign in on the production URL.
- Run `pnpm nx run grimoire:migrate` against the production database once before first use, and again after any new migration.

The build checks that the committed card list is a real Scryfall build and fails the deploy if it is missing, too small, or made from the sample file.

## Refreshing the card list

When a new set is released:

1. `pnpm nx run grimoire:card-names` (downloads about 150 MB from Scryfall and rewrites the list).
2. Commit `apps/grimoire/public/data/card-names.json` and open a PR.

## Commands

| Command                                 | What it does                                    |
| --------------------------------------- | ----------------------------------------------- |
| `pnpm dev:grimoire`                     | Dev server on :3000                             |
| `pnpm nx build grimoire`                | Production build                                |
| `pnpm nx test grimoire`                 | Unit, database and component tests (about 10 s) |
| `pnpm nx run grimoire:migrate`          | Apply `db/migrations/*.sql`                     |
| `pnpm nx run grimoire:card-names`       | Rebuild the card list from Scryfall             |
| `pnpm nx run grimoire:check-card-names` | Check the card list is deployable               |

## Tests

`nx test grimoire` runs Vitest. The database tests apply the real migrations to an in-process Postgres (PGlite) and exercise the real queries, including that one user can never read or change another user's cards. The sign-in gate, input validation, export format, fuzzy search, and card-list filtering have their own tests, and so does scanning: the route's limits and failure handling, the reply parsing, and the request sent to the API (against a stand-in for `fetch`, so no key or network is needed).

React component tests are `*.test.tsx` files. They run in jsdom with Testing Library (setup and a `<dialog>` shim in `vitest.setup.dom.ts`); every other test runs in node. Mock the store and query hooks at the module boundary, as `src/components/QueueView.test.tsx` does.

## Auto-capture

Tap _Start_ and the app watches the video; there is no Snap button and no per-card confirmation. Start also unlocks the capture sounds, holds a screen wake lock (where the browser allows it) and starts the background worker. About ten times a second it shrinks the frame to 64 x 48 grayscale and compares it with the empty background (`src/lib/autoCapture.ts`):

1. Start with nothing in frame so it can learn the background.
2. When a card fills enough of the frame and holds still for about 0.6 s, it captures once: the frame (plus a small thumbnail) is saved to the scan queue on the device and a chime plays. The worker reads each queued photo in the background; a low double tone plays when a card is flagged or fails. A running count (captured, identified, flagged, failed) and a link to _Review queue_ sit under the camera.
3. It will not capture again until the card is taken away for about 0.8 s, or a clearly different card replaces it. Captures are at least 2 s apart.

Every threshold is in the `AUTO_CAPTURE` object at the top of that file. Turn on _Debug_ for a readout over the video (how much of the frame changed, how much is moving, how long it has been still) to tune them under your lighting. The numbers there are starting guesses, tested only against synthetic frames, so expect to adjust them with a real camera.

Nothing is added to the collection while scanning. Review the queue at `/add/queue` (`/queue` redirects there) and commit the cards you want. Captured items survive a refresh (they live in IndexedDB) and expire after 12 hours. _Debug_ and _Tune_ are temporary tools for setting the thresholds above.

## Not yet done

- The rest of issue #43: showing the remaining scan budget in the UI, and a rate limit on sign-in. Set a spend limit on the API key's workspace before enabling scanning in production.
- The model confidence flag (M4.7), and the OCR-first accuracy and cost test (milestone 5).
- Installing as a home-screen app and requesting persistent storage.
- A cached copy of the card list in IndexedDB; for now it is fetched as a static file and cached by the browser.
