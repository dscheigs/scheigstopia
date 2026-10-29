import { NextResponse } from 'next/server';
import { addManyToLocation } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { badRequest, readJson, unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';
import { parseBulkBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Add many cards at once: { items: [{ oracleId, name, delta }], destination? }.
 * The copies go into the destination bag (an existing location, or a new bag
 * created by this request) or Unsorted, each recorded as a move from outside
 * the collection. All or nothing.
 */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseBulkBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const result = await addManyToLocation(
        getSql(),
        userId,
        parsed.value.items,
        parsed.value.destination
    );
    if (result.status === 'bad_location') {
        return badRequest('That location is not available.');
    }
    return NextResponse.json({
        items: result.items,
        locationId: result.locationId,
    });
}
