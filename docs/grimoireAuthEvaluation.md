# Grimoire auth: Better Auth or stay on Auth.js? (spike for #64)

**Recommendation: stay on Auth.js for now, and migrate to Better Auth together
with multi-user sharing (#45), or sooner if a security fix lands that Auth.js
does not get.**

Nothing here changes code. Findings about Better Auth come from its public
docs (read October 2026) and have not been run against Grimoire; items marked
_verify_ should be proven in the first migration PR.

## Where Grimoire stands today

- `apps/grimoire/src/auth.ts`: Auth.js (`next-auth` 5.0.0-beta.32), GitHub
  provider only, `session: { strategy: 'jwt' }`, no database adapter.
- `signIn` callback rejects every account except `ALLOWED_GITHUB_ID`.
- `jwt` callback calls `upsertUser(sql, githubId, login)` once at sign-in and
  puts the internal uuid in `token.userId`; `session` copies it to
  `session.user.id`. All data is keyed to that uuid (`users.id`), and
  `users.github_id` is unique.
- Every route handler and page checks the session itself through
  `getUserId()` in `src/lib/session.ts` (the only caller of `auth()` besides
  `AppHeader` and the sign-in page). There is no middleware.
- The client treats a 401 as "go to /signin" (`apiClient.ts`, `Providers.tsx`).

## Auth.js status

The Auth.js project now belongs to the Better Auth team. Its own migration page
says they keep handling security patches and critical issues, that there is "no
urgent need to migrate" if the current setup works, and that Better Auth is
the recommendation for new projects. So the risk of staying is slow
(no new features, a beta that never reaches stable), not immediate.

## Comparison for Grimoire's needs

| Need                                | Auth.js (today)                               | Better Auth                                                                                                                                      |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub sign-in                      | Built in, works                               | `socialProviders.github`, same OAuth app, new callback path (`/api/auth/callback/github` by default, same shape)                                 |
| Restrict to one account             | `signIn` callback                             | No equivalent single callback; use a database hook that rejects user creation, or a check in the OAuth profile mapping _(verify the exact hook)_ |
| Session check in routes             | `auth()`                                      | `auth.api.getSession({ headers })`; fits behind the existing `getUserId()`                                                                       |
| Internal user id, not the GitHub id | Hand-rolled in the `jwt` callback             | Native: Better Auth owns its own user id and links provider accounts to it                                                                       |
| Several sign-in methods per user    | Needs an adapter and account table, not built | Built in (account linking)                                                                                                                       |
| Stateless sessions, no DB reads     | JWT strategy                                  | Supported (signed cookie cache), but session revocation is weak in that mode                                                                     |
| Long-term maintenance               | Security fixes only                           | Actively developed                                                                                                                               |

For a single owner, Auth.js already does the job. The gain from Better Auth
is almost entirely in the multi-user case (#45): linked accounts, invites,
revocable sessions.

## Schema impact

Better Auth's core tables are `user`, `session`, `account` and `verification`.
The migration guide says the core schema can be customized, so the existing
`users` table can probably be the Better Auth user table rather than a second
one (_verify_ the model and field name options; the database concepts page was
not read for this spike).

Mapping, as far as the docs show:

- `users.id` (uuid) stays the primary key and stays the id every other table
  references. Better Auth generates string ids by default, so it must be told
  to produce uuids (or to leave id generation to Postgres) _(verify)_.
- `users` needs the columns Better Auth requires and Grimoire lacks: `name`,
  `email` (unique, required), `email_verified` (boolean), `updated_at`.
  GitHub supplies name and email, but a GitHub account with no public email
  needs handling _(verify; GitHub's email scope is requested by default)_.
- `users.github_id` and `users.login` are not Better Auth fields. Keep
  them as extra columns, or drop `github_id` once the `account` row carries
  it (`account.accountId` is the provider's user id).
- New tables: `account` (one row per linked sign-in, holds the GitHub id),
  and `session` and `verification` only if database sessions are used.
- Existing sign-ins keep pointing at the same user: for the one existing
  user, a migration inserts an `account` row with `providerId = 'github'`
  and `accountId = users.github_id::text`. Other tables do not change.
- Migrations are plain SQL files in `db/migrations/` run by Grimoire's own
  runner (simple statements, split on semicolons), so the Better Auth CLI is
  used to _generate_ the SQL, which is then committed as a normal migration,
  not run against production by the CLI.

Because the existing user has no password and is created by GitHub sign-in,
the credential-migration part of the official guide does not apply.

## Existing sessions

Auth.js JWT cookies are not readable by Better Auth. The cookie names and
formats differ, so everyone is signed out once at cutover. With one user,
that is acceptable.

## Code that changes

- `src/auth.ts`: replaced by a `betterAuth({...})` instance.
- `src/app/api/auth/[...nextauth]/route.ts`: becomes `[...all]` using
  `toNextJsHandler(auth)`.
- `src/lib/session.ts`: `getUserId()` calls `auth.api.getSession({ headers:
await headers() })`. Every route and page already goes through it, so the
  routes do not change. `src/app/api/routesAuth.test.ts` and
  `identify/route.test.ts` mock `@/lib/session`, so they are unaffected.
- `src/app/signin/page.tsx`: the server action calling `signIn('github')`
  becomes `auth.api.signInSocial` (server) or `authClient.signIn.social`
  (client button). The error mapping (`AccessDenied`) changes to Better
  Auth's error codes.
- `src/components/AppHeader.tsx`: `auth()`/`signOut` become
  `auth.api.getSession` / `auth.api.signOut`.
- `src/types/next-auth.d.ts`: deleted; the user id type comes from Better Auth.
- `apiFetch` 401 handling and `Providers.tsx`: unchanged, as long as
  `getUserId()` still returns null for no session.
- Environment: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` become
  Better Auth's names (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, plus the GitHub
  pair). The GitHub OAuth app's callback URL has to be checked or updated, and
  the preview and production Vercel environments set again.
- Service worker: `sw.js` caches pages; any auth route path change must not be
  served from its cache (relevant to #142).

## Compatibility

- **Next.js 16 / React:** the migration guide targets the App Router with
  route handlers and `headers()`, which is what Grimoire uses. The
  guide says to check sessions in each page or route, not in proxy/middleware,
  which matches Grimoire's no-middleware design. This is independent of the
  Next.js upgrade tracked in #63.
- **Neon serverless:** Better Auth talks to Postgres through an adapter
  (`pg` Pool, Kysely, Drizzle, Prisma). Grimoire uses `@neondatabase/serverless`
  with a tagged-template `Sql` function and runs its tests on PGlite. The
  Neon driver exposes a `pg`-compatible `Pool`, which Better Auth/Kysely can
  use, but that adds a second DB access path next to the `Sql` function _(verify
  on a Vercel preview, including cold-start cost)_. Stateless sessions would
  avoid database reads on every request, but then session data lives only in
  the cookie.
- **Tests on PGlite:** Better Auth's own tables would need to exist in the
  PGlite test setup, or the auth instance is not constructed in database tests.
- **Security note:** Better Auth had a medium-severity OAuth-state issue
  (CVE-2026-67335, fixed in 1.6.2) only when `storeStateStrategy: "cookie"`
  is used with certain settings. Pin a current version and keep the default
  database state strategy unless stateless mode is chosen on purpose.

## Migration path and size

One PR is enough for a single-user app, if it is done in this order inside the
PR: generate and commit the migration, add the `account` backfill, swap
`auth.ts`/route/session/sign-in/header, update env docs, and test on a Vercel
preview with a real GitHub sign-in. Rough size: a few hundred changed lines,
about a day including preview verification. A rollback is possible because the
migration only adds columns and tables.

If done together with #45, split it:

1. Better Auth swap with the same single-user behaviour (the PR above).
2. Invite/allowlist table replacing `ALLOWED_GITHUB_ID`.
3. A second sign-in method and account linking.
4. Per-user cost limits (already tracked with #43).

## Decision

- **Now:** stay on Auth.js. It works, it is getting security fixes, and the
  migration buys nothing for one user while costing a sign-out, an OAuth
  app change and a second database path.
- **At #45:** do the swap as step 1 above, first, before any multi-user work,
  so the sharing features are built once, on the library that has a future.
- **Earlier if:** a security advisory affects `next-auth` v5 beta and no patch
  is published, or Next.js/React upgrades (#63) break it.

## Sources

- [Auth.js: migrate to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth)
- [Better Auth: migrating from NextAuth.js](https://better-auth.com/docs/guides/next-auth-migration-guide)
- [Better Auth: session management](https://better-auth.com/docs/concepts/session-management)
- [GHSA-wxw3-q3m9-c3jr / CVE-2026-67335](https://corgea.com/advisories/vulnerabilities/GHSA-wxw3-q3m9-c3jr)
