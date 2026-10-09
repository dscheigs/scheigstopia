import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, isUnauthorized } from '@/lib/api-client';

const fetchMock = vi.fn();

afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

function stub(response: Response) {
    fetchMock.mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
}

describe('apiFetch', () => {
    it('returns the parsed body', async () => {
        stub(Response.json({ items: [] }));
        expect(await apiFetch('/api/collection')).toEqual({ items: [] });
    });

    it('sends `json` as a JSON body with a content type', async () => {
        stub(Response.json({}));
        await apiFetch('/api/collection', { method: 'POST', json: { a: 1 } });
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        expect(init.body).toBe('{"a":1}');
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('passes a raw body and headers through untouched', async () => {
        stub(Response.json({}));
        const blob = new Blob(['x']);
        await apiFetch('/api/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: blob,
        });
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.body).toBe(blob);
        expect(init.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    });

    it("throws the server's message and status on failure", async () => {
        stub(Response.json({ error: 'Too big.' }, { status: 413 }));
        const error = await apiFetch('/x').catch((e: unknown) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ message: 'Too big.', status: 413 });
    });

    it('falls back to a generic message when the body is not JSON', async () => {
        stub(new Response('nope', { status: 500 }));
        await expect(apiFetch('/x')).rejects.toMatchObject({
            message: 'Request failed (500).',
            status: 500,
        });
    });
});

describe('isUnauthorized', () => {
    it('is true only for a 401 ApiError', () => {
        expect(isUnauthorized(new ApiError('x', 401))).toBe(true);
        expect(isUnauthorized(new ApiError('x', 403))).toBe(false);
        expect(isUnauthorized(new Error('x'))).toBe(false);
    });
});
