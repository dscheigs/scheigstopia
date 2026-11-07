import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { unauthorized } from '@/lib/http';
import { listRareCandidates } from '@/lib/locations';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Groups of copies in Unsorted or bulk that are not overridden to `bulk`. The
 * browser knows rarity and decides which of them need attention.
 */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const items = await listRareCandidates(getSql(), userId);
    return NextResponse.json({ items });
}
