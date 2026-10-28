import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, notFound, readJson, unauthorized } from '@/lib/http';
import { updateLocation } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { isUuid, parseUpdateLocationBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/** Rename, change the note, or archive/restore: { label?, note?, archived? }. */
export async function PATCH(request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isUuid(id)) return badRequest('id must be a UUID.');

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseUpdateLocationBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const result = await updateLocation(getSql(), userId, id, parsed.value);
    if (result.status === 'not_found') return notFound();
    if (result.status === 'system') {
        return NextResponse.json(
            { error: 'The Unsorted location cannot be changed.' },
            { status: 409 }
        );
    }
    if (result.status === 'not_empty') {
        return NextResponse.json(
            { error: 'Move the cards out before archiving this location.' },
            { status: 409 }
        );
    }
    return NextResponse.json({ item: result.location });
}
