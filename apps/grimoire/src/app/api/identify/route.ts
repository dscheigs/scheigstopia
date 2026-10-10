import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, unauthorized } from '@/lib/http';
import {
    IdentifyError,
    MAX_IMAGE_BYTES,
    imageTypeOf,
    readBodyLimited,
    readCardName,
    sniffImageType,
} from '@/lib/identify';
import {
    limitMessage,
    readLimits,
    releaseIdentify,
    reserveIdentify,
    retryAfterSeconds,
} from '@/lib/identifyLimits';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

const fail = (error: string, status: number) =>
    NextResponse.json({ error }, { status });

/**
 * Read the card name from a photo. The body is the image itself (not JSON),
 * sent with its own Content-Type. Replies { name } where name is null when the
 * photo could not be read. Matching to a real card happens on the client.
 */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    // No key, no scanning. Nothing is called or charged until it is set.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return fail('Card scanning is not set up on this server.', 503);
    }

    const mediaType = imageTypeOf(request.headers.get('content-type'));
    if (!mediaType) {
        return fail(
            'Send the photo as image/jpeg, image/png or image/webp.',
            415
        );
    }

    const bytes = await readBodyLimited(request, MAX_IMAGE_BYTES);
    if (bytes === 'too_large') {
        return fail('That image is too large.', 413);
    }
    // Check the bytes are really the image they claim, before paying to read it.
    if (bytes.length === 0 || sniffImageType(bytes) !== mediaType) {
        return badRequest("That doesn't look like a valid image.");
    }

    // Count this scan before paying for it; refused requests make no API call.
    const sql = getSql();
    const reservation = await reserveIdentify(sql, userId, readLimits());
    if (!reservation.allowed) {
        return NextResponse.json(
            { error: limitMessage[reservation.window] },
            {
                status: 429,
                headers: {
                    'Retry-After': String(
                        retryAfterSeconds(reservation.window)
                    ),
                },
            }
        );
    }

    try {
        const name = await readCardName(
            { bytes, mediaType },
            { apiKey, model: process.env.IDENTIFY_MODEL }
        );
        return NextResponse.json({ name });
    } catch (error) {
        // Give the scan back only when the provider answered with an error
        // status. A timeout or dropped connection may still have been billed.
        if (error instanceof IdentifyError && error.status !== undefined) {
            await releaseIdentify(sql, userId, reservation.id).catch(() => {});
        }
        // Log what failed, never the image or the key.
        console.error(
            'identify failed',
            error instanceof IdentifyError
                ? (error.status ?? error.message)
                : ''
        );
        return fail(
            "Couldn't reach the card reader. Try again in a moment.",
            502
        );
    }
}
