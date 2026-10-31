// Builds apps/grimoire/public/data/card-names.json from Scryfall bulk data.
//
//   pnpm nx run grimoire:card-names
//   node apps/grimoire/scripts/buildCardNames.mjs --fixture <oracle-cards.json>
//
// With --fixture it reads a local file instead of calling Scryfall, which is
// handy offline. Without it, it downloads the current "Oracle Cards" file
// (~150 MB) once; that file is rebuilt by Scryfall about every 12 hours.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import {
    addPrintingRarity,
    pickOracleCardsEntry,
    reduceRarities,
    slimOracleCards,
} from './cardNamesLib.mjs';

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

// Scryfall publishes the bulk file as gzipped JSON Lines (one card per line).
async function getJsonl(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`${url} responded ${response.status}`);
    }
    const text = gunzipSync(Buffer.from(await response.arrayBuffer())).toString(
        'utf8'
    );
    return text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line));
}

// The Oracle Cards file carries the rarity of just one printing per card, not
// the rarest, so rarities come from the Default Cards file (every printing,
// ~500 MB of gzipped JSON Lines). It is streamed line by line, never held whole.
async function getRarities(url) {
    const response = await fetch(url, { headers });
    if (!response.ok || !response.body) {
        throw new Error(`${url} responded ${response.status}`);
    }
    const rarities = new Map();
    const lines = createInterface({
        input: Readable.fromWeb(response.body).pipe(createGunzip()),
        crlfDelay: Infinity,
    });
    for await (const line of lines) {
        if (line.trim() === '') continue;
        addPrintingRarity(rarities, JSON.parse(line));
    }
    return rarities;
}

async function load() {
    const fixtureFlag = process.argv.indexOf('--fixture');
    if (fixtureFlag !== -1) {
        const fixturePath = process.argv[fixtureFlag + 1];
        if (!fixturePath) throw new Error('--fixture needs a file path');
        const cards = JSON.parse(await readFile(fixturePath, 'utf8'));
        // Optionally a second file of printings: --printings <file>.
        const printingsFlag = process.argv.indexOf('--printings');
        const printingsPath =
            printingsFlag === -1 ? null : process.argv[printingsFlag + 1];
        if (printingsFlag !== -1 && !printingsPath) {
            throw new Error('--printings needs a file path');
        }
        const rarities = printingsPath
            ? reduceRarities(JSON.parse(await readFile(printingsPath, 'utf8')))
            : undefined;
        return { cards, version: 'fixture', rarities };
    }

    const bulk = await getJson('https://api.scryfall.com/bulk-data');
    const entry = pickOracleCardsEntry(bulk);
    const url = entry.download_uri ?? entry.jsonl_download_uri;
    console.log(`Downloading ${url} ...`);
    const cards = entry.download_uri ? await getJson(url) : await getJsonl(url);
    const defaultEntry = bulk.data?.find(
        (item) => item?.type === 'default_cards'
    );
    const defaultUrl = defaultEntry?.jsonl_download_uri;
    if (typeof defaultUrl !== 'string') {
        throw new Error('Default Cards entry not found in Scryfall bulk-data');
    }
    console.log(`Downloading ${defaultUrl} for rarities ...`);
    const rarities = await getRarities(defaultUrl);
    return { cards, version: entry.updated_at, rarities };
}

const { cards, version, rarities } = await load();
if (!Array.isArray(cards)) throw new Error('Expected an array of cards');

const slim = slimOracleCards(cards, version, rarities);
if (slim.count === 0)
    throw new Error('No cards after filtering; refusing to write');

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(slim));
console.log(`Wrote ${slim.count} cards (version ${version}) to ${outFile}`);
