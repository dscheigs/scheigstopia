import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, notFound, unauthorized } from '@/lib/http';
import { undoMove } from '@/lib/locations';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/** Undo the batch of moves that `id` belongs to, with a compensating move. */
export async function POST(_request: Request, { params }: RouteContext) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!/^\d{1,15}$/.test(id)) return badRequest('id must be a move id.');

    const result = await undoMove(getSql(), userId, Number(id));
    if (result.status === 'not_found') return notFound();
    if (result.status === 'not_undoable') {
        return badRequest('Only a move between locations can be undone.');
    }
    if (result.status === 'bad_location') {
        return NextResponse.json(
            { error: 'The place these cards came from is archived.' },
            { status: 409 }
        );
    }
    if (result.status === 'moved_on') {
        return NextResponse.json(
            {
                error: 'These cards have moved since, so this cannot be undone.',
            },
            { status: 409 }
        );
    }
    return NextResponse.json({ undone: result.undone });
}
