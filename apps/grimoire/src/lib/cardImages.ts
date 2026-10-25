// Card images come straight from Scryfall's CDN (hotlinking is allowed and its
// rate limits apply to the API, not the CDN). The card list carries each card's
// image id; the URL is built here. Plain <img>, no Next image optimizer: the
// CDN already serves right-sized files.

import type { CardNameFile } from '@/lib/cardSearch';

export const SCRYFALL_IMAGE_ORIGIN = 'https://cards.scryfall.io';

/** `small` is about 146x204 (list thumbnails); `normal` about 488x680 (preview). */
export type CardImageSize = 'small' | 'normal';

/** Thumbnail and preview sizes in px, from Scryfall's published dimensions. */
export const CARD_IMAGE_DIMENSIONS: Record<
    CardImageSize,
    { width: number; height: number }
> = {
    small: { width: 146, height: 204 },
    normal: { width: 488, height: 680 },
};

const IMAGE_ID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The CDN URL of a card's front face, or null for an id that is not a uuid. */
export function cardImageUrl(
    imageId: string,
    size: CardImageSize
): string | null {
    if (!IMAGE_ID.test(imageId)) return null;
    return `${SCRYFALL_IMAGE_ORIGIN}/${size}/front/${imageId[0]}/${imageId[1]}/${imageId}.jpg`;
}

/** oracleId -> image id, for the cards in the list that have one. */
export function buildImageIds(file: CardNameFile): Map<string, string> {
    const ids = new Map<string, string>();
    for (const [oracleId, , imageId] of file.cards) {
        if (imageId) ids.set(oracleId, imageId);
    }
    return ids;
}

const preloaded = new Set<string>();

/**
 * Starts fetching the preview image so it opens without a visible delay. Safe
 * to call on every pointer event; each URL is requested once.
 */
export function preloadCardImage(
    imageId: string,
    size: CardImageSize = 'normal'
): void {
    const url = cardImageUrl(imageId, size);
    if (!url || preloaded.has(url) || typeof Image === 'undefined') return;
    preloaded.add(url);
    new Image().src = url;
}
