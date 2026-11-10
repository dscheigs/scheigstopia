import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, notFound, unauthorized } from '@/lib/http';
import { listLocationContents } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { isUuid } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/** The location and the cards in it, sorted by name. */
export async function GET(_request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isUuid(id)) return badRequest('id must be a UUID.');

    const result = await listLocationContents(getSql(), userId, id);
    if (!result) return notFound();
    return NextResponse.json(result);
}
