import { NextResponse } from 'next/server';
import { addManyToCollection } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { badRequest, readJson, unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';
import { parseBulkBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Add many cards at once: { items: [{ oracleId, name, delta }] }. All or nothing. */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseBulkBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const items = await addManyToCollection(
        getSql(),
        userId,
        parsed.value.items
    );
    return NextResponse.json({ items });
}
