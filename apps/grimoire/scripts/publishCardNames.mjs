// Publishes the freshly built card list to a public Vercel Blob store, so the
// app can read it without a deploy. Used by the weekly refresh workflow.
//
//   node apps/grimoire/scripts/publishCardNames.mjs <fallback-previous.json>
//
// Environment:
//   BLOB_READ_WRITE_TOKEN  required. The script fails, loudly, without it.
//   CARD_NAMES_URL         optional. Public URL of the list as currently
//                          published. It is the baseline for the "is it sane"
//                          and "did it change" checks. If unset, unreachable
//                          or invalid (first run), the file given as the
//                          argument (the committed list) is used instead.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '@vercel/blob';
import {
    assertSaneRefresh,
    isCardList,
    shouldUploadCardList,
} from './cardNamesLib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const listFile = path.join(
    scriptDir,
    '..',
    'public',
    'data',
    'card-names.json'
);

async function fetchPublished(url) {
    if (!url) return null;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        if (!isCardList(body)) throw new Error('not a card list');
        return body;
    } catch (error) {
        console.warn(
            `Could not use the published list at ${url} (${error.message}); ` +
                'falling back to the committed one.'
        );
        return null;
    }
}

try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error(
            'BLOB_READ_WRITE_TOKEN is not set, so the card list cannot be ' +
                'uploaded. Create a public Vercel Blob store and add its ' +
                'read-write token as the BLOB_READ_WRITE_TOKEN repository ' +
                'secret (see apps/grimoire/README.md, "Refreshing the card list").'
        );
    }
    const fallbackFile = process.argv[2];
    if (!fallbackFile) {
        throw new Error(
            'Usage: publishCardNames.mjs <fallback previous card-names.json>'
        );
    }

    const raw = await readFile(listFile, 'utf8');
    const next = JSON.parse(raw);
    const published = await fetchPublished(process.env.CARD_NAMES_URL);
    const baseline =
        published ?? JSON.parse(await readFile(fallbackFile, 'utf8'));

    // Never upload a list that fails the sanity check.
    assertSaneRefresh(baseline, next);

    if (!shouldUploadCardList(published ?? baseline, next)) {
        console.log(
            `Card list is unchanged (${next.count} cards); not uploading.`
        );
        process.exit(0);
    }

    const blob = await put('card-names.json', raw, {
        access: 'public',
        allowOverwrite: true,
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
        contentType: 'application/json',
    });
    console.log(`Uploaded ${next.count} cards to ${blob.url}`);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
