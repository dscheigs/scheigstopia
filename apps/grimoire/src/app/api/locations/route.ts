import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, readJson, unauthorized } from '@/lib/http';
import { createLocation, listLocations } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { parseCreateLocationBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** The signed-in user's locations. Add ?archived=1 to include archived ones. */
export async function GET(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const includeArchived =
        new URL(request.url).searchParams.get('archived') === '1';
    const items = await listLocations(getSql(), userId, { includeArchived });
    return NextResponse.json({ items });
}

/** Create a location: { kind, label, note?, parentId? }. */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseCreateLocationBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const item = await createLocation(getSql(), userId, parsed.value);
    if (!item) return badRequest('parentId is not one of your locations.');
    return NextResponse.json({ item }, { status: 201 });
}
