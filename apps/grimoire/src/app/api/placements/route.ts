import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { unauthorized } from '@/lib/http';
import { listAllPlacements } from '@/lib/locations';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Where every owned card is: one entry per card and location. */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const items = await listAllPlacements(getSql(), userId);
    return NextResponse.json({ items });
}
