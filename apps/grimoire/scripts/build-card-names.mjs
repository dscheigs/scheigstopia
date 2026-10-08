// Builds apps/grimoire/public/data/card-names.json from Scryfall bulk data.
//
//   pnpm nx run grimoire:card-names
//   node apps/grimoire/scripts/build-card-names.mjs --fixture <oracle-cards.json>
//
// With --fixture it reads a local file instead of calling Scryfall, which is
// handy offline. Without it, it downloads the current "Oracle Cards" file
// (~150 MB) once; that file is rebuilt by Scryfall about every 12 hours.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slimOracleCards } from './card-names-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(scriptDir, '..', 'public', 'data', 'card-names.json');

// Scryfall asks API clients to send both of these headers.
const headers = {
    'User-Agent': 'Grimoire/0.1 (+https://github.com/dscheigs/scheigstopia)',
    Accept: 'application/json;q=0.9,*/*;q=0.8',
};

async function getJson(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`${url} responded ${response.status}`);
    }
    return response.json();
}

async function load() {
    const fixtureFlag = process.argv.indexOf('--fixture');
    if (fixtureFlag !== -1) {
        const fixturePath = process.argv[fixtureFlag + 1];
        if (!fixturePath) throw new Error('--fixture needs a file path');
        const cards = JSON.parse(await readFile(fixturePath, 'utf8'));
        return { cards, version: 'fixture' };
    }

    const bulk = await getJson('https://api.scryfall.com/bulk-data');
    const entry = bulk.data?.find((item) => item.type === 'oracle_cards');
    if (!entry?.download_uri) {
        throw new Error('oracle_cards entry not found in Scryfall bulk-data');
    }
    console.log(`Downloading ${entry.download_uri} ...`);
    const cards = await getJson(entry.download_uri);
    return { cards, version: entry.updated_at };
}

const { cards, version } = await load();
if (!Array.isArray(cards)) throw new Error('Expected an array of cards');

const slim = slimOracleCards(cards, version);
if (slim.count === 0)
    throw new Error('No cards after filtering; refusing to write');

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(slim));
console.log(`Wrote ${slim.count} cards (version ${version}) to ${outFile}`);
