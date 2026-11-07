import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, notFound, readJson, unauthorized } from '@/lib/http';
import { setRareRule } from '@/lib/locations';
import { getUserId } from '@/lib/session';
import { parseRareRuleBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Set or clear the rare override on a card's copies in one location:
 * { oracleId, locationId, rule: "bulk" | "keep" | null }.
 */
export async function PUT(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readJson(request);
    if (!body.ok) return badRequest(body.error);
    const parsed = parseRareRuleBody(body.value);
    if (!parsed.ok) return badRequest(parsed.error);

    const changed = await setRareRule(getSql(), userId, parsed.value);
    if (changed === 0) return notFound();
    return NextResponse.json({ changed });
}
