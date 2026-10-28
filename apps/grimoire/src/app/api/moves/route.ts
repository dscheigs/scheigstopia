import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, readJson, unauthorized } from '@/lib/http';
import { recordMoves } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { parseMovesBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Move copies between locations:
 * { moves: [{ oracleId, from, to, quantity }], note? }. All or nothing.
 */
export async function POST(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseMovesBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const result = await recordMoves(
        getSql(),
        userId,
        parsed.value.moves,
        parsed.value.note
    );
    if (result.status === 'bad_location') {
        return badRequest(
            'A location is unknown, or a destination is archived.'
        );
    }
    if (result.status === 'short') {
        return NextResponse.json(
            {
                error: 'A source location does not hold that many copies.',
                lines: result.lines,
            },
            { status: 409 }
        );
    }
    return NextResponse.json({ moved: result.moved });
}
