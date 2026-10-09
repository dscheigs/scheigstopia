import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES } from '@/lib/identify';
import { releaseIdentify, reserveIdentify } from '@/lib/identifyLimits';
import { getUserId } from '@/lib/session';
import { POST } from './route';

vi.mock('@/lib/session', () => ({ getUserId: vi.fn() }));
vi.mock('@/lib/db', () => ({ getSql: () => vi.fn() }));
vi.mock('@/lib/identifyLimits', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/identifyLimits')>()),
    reserveIdentify: vi.fn(),
    releaseIdentify: vi.fn(),
}));

const SECRET = 'sk-test-secret';

function jpeg(size = 64): Uint8Array {
    const bytes = new Uint8Array(size);
    bytes.set([0xff, 0xd8, 0xff, 0xe0]);
    return bytes;
}

function post(body: Uint8Array | null, contentType = 'image/jpeg') {
    return new Request('http://localhost/api/identify', {
        method: 'POST',
        headers: { 'content-type': contentType },
        body,
    });
}

const reply = (text: string) =>
    new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
        status: 200,
    });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.mocked(getUserId).mockResolvedValue('user-1');
    vi.mocked(reserveIdentify).mockResolvedValue({ allowed: true, id: '7' });
    vi.mocked(releaseIdentify).mockResolvedValue();
    vi.stubEnv('ANTHROPIC_API_KEY', SECRET);
    vi.stubEnv('IDENTIFY_MODEL', '');
    fetchMock = vi.fn().mockResolvedValue(reply('Lightning Bolt'));
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('POST /api/identify', () => {
    it('rejects signed-out requests without calling the API', async () => {
        vi.mocked(getUserId).mockResolvedValue(null);
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(401);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('is off until a key is set, and calls nothing', async () => {
        vi.stubEnv('ANTHROPIC_API_KEY', '');
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(503);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a body that is not an image type', async () => {
        const response = await POST(post(jpeg(), 'application/json'));
        expect(response.status).toBe(415);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an oversized image without calling the API', async () => {
        const response = await POST(post(jpeg(MAX_IMAGE_BYTES + 1)));
        expect(response.status).toBe(413);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('accepts an image of exactly the maximum size', async () => {
        const response = await POST(post(jpeg(MAX_IMAGE_BYTES)));
        expect(response.status).toBe(200);
    });

    it('rejects an empty body', async () => {
        const response = await POST(post(null));
        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects bytes that are not the image they claim to be', async () => {
        const notAnImage = new TextEncoder().encode('{"hello":"world"}');
        const response = await POST(post(notAnImage));
        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a PNG sent as a JPEG', async () => {
        const png = new Uint8Array([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
        ]);
        const response = await POST(post(png, 'image/jpeg'));
        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the name the model read', async () => {
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ name: 'Lightning Bolt' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns a null name for an unreadable photo', async () => {
        fetchMock.mockResolvedValue(reply('UNREADABLE'));
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ name: null });
    });

    it('uses IDENTIFY_MODEL when it is set', async () => {
        vi.stubEnv('IDENTIFY_MODEL', 'some-other-model');
        await POST(post(jpeg()));
        const body = JSON.parse(
            (fetchMock.mock.calls[0][1] as RequestInit).body as string
        );
        expect(body.model).toBe('some-other-model');
    });

    it('refuses past the cap with a friendly message and no API call', async () => {
        vi.mocked(reserveIdentify).mockResolvedValue({
            allowed: false,
            window: 'day',
        });
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(429);
        expect((await response.json()).error).toMatch(/today's scan limit/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not count requests that fail validation', async () => {
        await POST(post(new Uint8Array(0)));
        await POST(post(jpeg(), 'text/plain'));
        expect(reserveIdentify).not.toHaveBeenCalled();
    });

    it('gives back the reserved scan when the provider fails', async () => {
        fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
        await POST(post(jpeg()));
        expect(releaseIdentify).toHaveBeenCalledWith(
            expect.anything(),
            'user-1',
            '7'
        );
    });

    it('keeps the scan counted when the call may have been billed', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchMock.mockRejectedValue(new Error('timeout'));
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(502);
        expect(releaseIdentify).not.toHaveBeenCalled();
    });

    it('reports a provider failure without leaking details or the key', async () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchMock.mockResolvedValue(
            new Response(`{"error":"bad key ${SECRET}"}`, { status: 401 })
        );
        const response = await POST(post(jpeg()));
        expect(response.status).toBe(502);
        const text = await response.text();
        expect(text).not.toContain(SECRET);
        expect(text).not.toContain('bad key');
        expect(JSON.stringify(logged.mock.calls)).not.toContain(SECRET);
    });
});
