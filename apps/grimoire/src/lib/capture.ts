// Settings for the photo the phone sends. Kept in one place so M5 can tune them.

/** Longest side, in pixels. Big enough to read a title bar, small to upload. */
export const CAPTURE_MAX_EDGE = 1280;

/** JPEG quality, 0 to 1. */
export const CAPTURE_QUALITY = 0.85;

/** Longest side of the review image kept in the queue, in pixels. */
export const REVIEW_MAX_EDGE = 600;

/** JPEG quality for the review image, 0 to 1. */
export const REVIEW_QUALITY = 0.75;

/** Scale `width` x `height` down to fit `maxEdge` on the longest side. Never up. */
export function fitWithin(
    width: number,
    height: number,
    maxEdge: number
): { width: number; height: number } {
    const longest = Math.max(width, height);
    if (longest <= maxEdge) return { width, height };
    const scale = maxEdge / longest;
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
    };
}
