import { NextResponse } from 'next/server';
import type { Parsed } from '@/lib/validation';

export const unauthorized = () =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export const badRequest = (error: string) =>
    NextResponse.json({ error }, { status: 400 });

export const notFound = () =>
    NextResponse.json({ error: 'Not found' }, { status: 404 });

/** Read a JSON request body, requiring an application/json content type. */
export async function readJson(request: Request): Promise<Parsed<unknown>> {
    if (!request.headers.get('content-type')?.includes('application/json')) {
        return { ok: false, error: 'Content-Type must be application/json.' };
    }
    try {
        return { ok: true, value: await request.json() };
    } catch {
        return { ok: false, error: 'Invalid JSON.' };
    }
}
