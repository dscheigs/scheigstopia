// Fails if the committed card list is missing or is not a real Scryfall build.
// Runs before the production build so a bad list can't ship.
//
//   pnpm nx run grimoire:check-card-names
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDeployableCardList } from './card-names-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(scriptDir, '..', 'public', 'data', 'card-names.json');

let list;
try {
    list = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
    console.error(
        `Could not read ${file}: ${error.message}\n` +
            'Run `pnpm nx run grimoire:card-names` and commit the result.'
    );
    process.exit(1);
}

try {
    assertDeployableCardList(list);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
console.log(`Card list OK: ${list.count} cards (version ${list.version})`);
