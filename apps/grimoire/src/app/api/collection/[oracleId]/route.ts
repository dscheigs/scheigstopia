import { NextResponse } from 'next/server';
import { removeFromCollection, setQuantity } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { badRequest, notFound, readJson, unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';
import { isUuid, parseQuantityBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ oracleId: string }>;
}

/** Set an exact quantity: { quantity }. Zero removes the card. */
export async function PATCH(request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { oracleId } = await params;
    if (!isUuid(oracleId)) return badRequest('oracleId must be a UUID.');

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseQuantityBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const result = await setQuantity(
        getSql(),
        userId,
        oracleId,
        parsed.value.quantity
    );
    if (result.status === 'not_found') return notFound();
    if (result.status === 'removed')
        return NextResponse.json({ removed: true });
    return NextResponse.json({ item: result.item });
}

/** Remove a card from the collection. */
export async function DELETE(_request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { oracleId } = await params;
    if (!isUuid(oracleId)) return badRequest('oracleId must be a UUID.');

    const removed = await removeFromCollection(getSql(), userId, oracleId);
    return removed ? NextResponse.json({ removed: true }) : notFound();
}
