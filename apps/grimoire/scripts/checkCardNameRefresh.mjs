// Sanity check for the scheduled card-list refresh. Compares the freshly built
// card-names.json with a previous copy and fails if the new one is not safe to
// propose (empty, built from the fixture, or sharply smaller).
//
//   node apps/grimoire/scripts/checkCardNameRefresh.mjs <previous.json>
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSaneRefresh } from './cardNamesLib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextFile = path.join(
    scriptDir,
    '..',
    'public',
    'data',
    'card-names.json'
);
const previousFile = process.argv[2];
if (!previousFile) {
    console.error('Usage: checkCardNameRefresh.mjs <previous card-names.json>');
    process.exit(1);
}

try {
    const previous = JSON.parse(await readFile(previousFile, 'utf8'));
    const next = JSON.parse(await readFile(nextFile, 'utf8'));
    assertSaneRefresh(previous, next);
    console.log(`Refresh OK: ${previous.count} -> ${next.count} cards`);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
