import { NextResponse } from 'next/server';
import { addToCollection, listCollection } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { badRequest, readJson, unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';
import { parseAddBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** The signed-in user's whole collection. */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const items = await listCollection(getSql(), userId);
    return NextResponse.json({ items });
}

/** Add copies of a card: { oracleId, name, delta? }. */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseAddBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const item = await addToCollection(getSql(), userId, parsed.value);
    return NextResponse.json({ item });
}
