import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, unauthorized } from '@/lib/http';
import { listHistory } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { isUuid } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ oracleId: string }>;
}

/** Every move of a card's copies, newest first. */
export async function GET(_request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { oracleId } = await params;
    if (!isUuid(oracleId)) return badRequest('oracleId must be a UUID.');

    const items = await listHistory(getSql(), userId, oracleId);
    return NextResponse.json({ items });
}
