import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// There is no middleware, so every API handler checks the session itself.
// This test fails if a new handler forgets to.

const apiDir = __dirname;
const HANDLER = /export async function (GET|POST|PUT|PATCH|DELETE)\b/g;

// Auth.js owns /api/auth/*; its handlers do their own checks.
const routeFiles = readdirSync(apiDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => path.basename(file) === 'route.ts')
    .filter((file) => !file.split(path.sep).includes('auth'))
    .sort();

/** Each exported HTTP handler's source, keyed by "<file> <METHOD>". */
function handlersIn(file: string): Record<string, string> {
    const source = readFileSync(path.join(apiDir, file), 'utf8');
    const starts = [...source.matchAll(HANDLER)];
    return Object.fromEntries(
        starts.map((match, i) => [
            `${file} ${match[1]}`,
            source.slice(match.index, starts[i + 1]?.index ?? source.length),
        ])
    );
}

describe('API route auth', () => {
    it('finds the route files', () => {
        expect(routeFiles.length).toBeGreaterThan(0);
    });

    it.each(routeFiles)('%s only exports async function handlers', (file) => {
        const source = readFileSync(path.join(apiDir, file), 'utf8');
        const exportedHttp = source.match(
            /export (?:const|function) (GET|POST|PUT|PATCH|DELETE)\b/g
        );
        // A handler written another way would slip past the check below.
        expect(exportedHttp).toBeNull();
        expect(Object.keys(handlersIn(file)).length).toBeGreaterThan(0);
    });

    it.each(routeFiles.flatMap((file) => Object.entries(handlersIn(file))))(
        '%s rejects unauthenticated requests',
        (_name, body) => {
            const userCheck = body.indexOf('await getUserId()');
            const reject = body.indexOf('unauthorized()');
            expect(userCheck).toBeGreaterThan(-1);
            expect(reject).toBeGreaterThan(userCheck);
            // The check must come before any database access.
            const firstDb = body.indexOf('getSql()');
            if (firstDb !== -1) expect(userCheck).toBeLessThan(firstDb);
        }
    );
});
