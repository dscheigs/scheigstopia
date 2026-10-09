import { describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_IDENTIFY_MODEL,
    IdentifyError,
    imageTypeOf,
    parseCardName,
    readBodyLimited,
    readCardName,
    sniffImageType,
} from '@/lib/identify';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);

describe('imageTypeOf', () => {
    it('accepts the allowed image types', () => {
        expect(imageTypeOf('image/jpeg')).toBe('image/jpeg');
        expect(imageTypeOf('image/png')).toBe('image/png');
        expect(imageTypeOf('image/webp')).toBe('image/webp');
    });

    it('ignores case and parameters', () => {
        expect(imageTypeOf('Image/JPEG; charset=binary')).toBe('image/jpeg');
    });

    it('rejects everything else', () => {
        expect(imageTypeOf(null)).toBeNull();
        expect(imageTypeOf('')).toBeNull();
        expect(imageTypeOf('application/json')).toBeNull();
        expect(imageTypeOf('image/gif')).toBeNull();
        expect(imageTypeOf('image/svg+xml')).toBeNull();
    });
});

describe('sniffImageType', () => {
    it('recognises JPEG, PNG and WebP by their first bytes', () => {
        expect(sniffImageType(JPEG)).toBe('image/jpeg');
        expect(sniffImageType(PNG)).toBe('image/png');
        expect(sniffImageType(WEBP)).toBe('image/webp');
    });

    it('rejects anything else', () => {
        expect(sniffImageType(new Uint8Array(0))).toBeNull();
        expect(
            sniffImageType(new TextEncoder().encode('<svg></svg>'))
        ).toBeNull();
        expect(sniffImageType(new TextEncoder().encode('{"a":1}'))).toBeNull();
        // RIFF but not WebP (for example a WAV file).
        const wav = new Uint8Array(WEBP);
        wav.set([0x57, 0x41, 0x56, 0x45], 8);
        expect(sniffImageType(wav)).toBeNull();
    });
});

describe('readBodyLimited', () => {
    const post = (body: Uint8Array) =>
        new Request('http://localhost/x', { method: 'POST', body });

    it('returns the bytes when under the limit', async () => {
        const bytes = await readBodyLimited(post(JPEG), 100);
        expect(bytes).toEqual(JPEG);
    });

    it('allows a body of exactly the limit', async () => {
        const bytes = await readBodyLimited(post(new Uint8Array(50)), 50);
        expect(bytes).not.toBe('too_large');
        expect((bytes as Uint8Array).length).toBe(50);
    });

    it('stops when the stream passes the limit', async () => {
        expect(await readBodyLimited(post(new Uint8Array(51)), 50)).toBe(
            'too_large'
        );
    });

    it('rejects on a declared Content-Length without reading the body', async () => {
        const read = vi.fn();
        const request = {
            headers: new Headers({ 'content-length': '999999' }),
            body: { getReader: read } as unknown as ReadableStream<Uint8Array>,
        };
        expect(await readBodyLimited(request, 1000)).toBe('too_large');
        expect(read).not.toHaveBeenCalled();
    });

    it('returns an empty array when there is no body', async () => {
        const request = new Request('http://localhost/x', { method: 'POST' });
        expect(await readBodyLimited(request, 100)).toEqual(new Uint8Array(0));
    });
});

describe('parseCardName', () => {
    it('returns a plain name', () => {
        expect(parseCardName('Lightning Bolt')).toBe('Lightning Bolt');
        expect(parseCardName('  Sol Ring \n')).toBe('Sol Ring');
    });

    it('strips quotes and markdown emphasis', () => {
        expect(parseCardName('"Lightning Bolt"')).toBe('Lightning Bolt');
        expect(parseCardName('**Sol Ring**')).toBe('Sol Ring');
        expect(parseCardName('`Counterspell`')).toBe('Counterspell');
    });

    it('keeps apostrophes inside names', () => {
        expect(parseCardName("Urza's Tower")).toBe("Urza's Tower");
    });

    it('collapses repeated spaces', () => {
        expect(parseCardName('Sol   Ring')).toBe('Sol Ring');
    });

    it('treats UNREADABLE as no name, however it is written', () => {
        expect(parseCardName('UNREADABLE')).toBeNull();
        expect(parseCardName('unreadable')).toBeNull();
        expect(parseCardName('"UNREADABLE"')).toBeNull();
    });

    it('does not guess when the reply is more than one line', () => {
        expect(
            parseCardName('Lightning Bolt\nThis is a red instant.')
        ).toBeNull();
    });

    it('rejects empty and absurdly long replies', () => {
        expect(parseCardName('')).toBeNull();
        expect(parseCardName('   \n  ')).toBeNull();
        expect(parseCardName('a'.repeat(201))).toBeNull();
    });
});

describe('readCardName', () => {
    const reply = (text: string) =>
        new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
            status: 200,
        });
    const image = { bytes: JPEG, mediaType: 'image/jpeg' } as const;
    const options = { apiKey: 'sk-test-secret' };

    it('returns the name the model read', async () => {
        const fetchMock = vi.fn().mockResolvedValue(reply('Lightning Bolt'));
        expect(
            await readCardName(image, { ...options, fetch: fetchMock })
        ).toBe('Lightning Bolt');
    });

    it('returns null when the model says it is unreadable', async () => {
        const fetchMock = vi.fn().mockResolvedValue(reply('UNREADABLE'));
        expect(
            await readCardName(image, { ...options, fetch: fetchMock })
        ).toBeNull();
    });

    it('returns null when the reply has no text block', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(new Response(JSON.stringify({ content: [] })));
        expect(
            await readCardName(image, { ...options, fetch: fetchMock })
        ).toBeNull();
    });

    it('sends the image to the Messages API with the key in a header only', async () => {
        const fetchMock = vi.fn().mockResolvedValue(reply('Sol Ring'));
        await readCardName(image, { ...options, fetch: fetchMock });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('https://api.anthropic.com/v1/messages');
        expect(init.method).toBe('POST');
        const headers = init.headers as Record<string, string>;
        expect(headers['x-api-key']).toBe('sk-test-secret');
        expect(headers['anthropic-version']).toBe('2023-06-01');

        const body = JSON.parse(init.body as string);
        expect(body.model).toBe(DEFAULT_IDENTIFY_MODEL);
        expect(body.max_tokens).toBeLessThanOrEqual(2048);
        expect(body.messages).toHaveLength(1);
        const [imageBlock, textBlock] = body.messages[0].content;
        expect(imageBlock).toEqual({
            type: 'image',
            source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: Buffer.from(JPEG).toString('base64'),
            },
        });
        expect(textBlock.type).toBe('text');
        expect(init.body).not.toContain('sk-test-secret');
    });

    it('uses the model it is given', async () => {
        const fetchMock = vi.fn().mockResolvedValue(reply('Sol Ring'));
        await readCardName(image, {
            ...options,
            model: 'some-other-model',
            fetch: fetchMock,
        });
        const body = JSON.parse(
            (fetchMock.mock.calls[0][1] as RequestInit).body as string
        );
        expect(body.model).toBe('some-other-model');
    });

    it('falls back to the default model for an empty one', async () => {
        const fetchMock = vi.fn().mockResolvedValue(reply('Sol Ring'));
        await readCardName(image, { ...options, model: '', fetch: fetchMock });
        const body = JSON.parse(
            (fetchMock.mock.calls[0][1] as RequestInit).body as string
        );
        expect(body.model).toBe(DEFAULT_IDENTIFY_MODEL);
    });

    it('throws an IdentifyError with the status when the service fails', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(new Response('{}', { status: 529 }));
        const error = await readCardName(image, {
            ...options,
            fetch: fetchMock,
        }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(IdentifyError);
        expect((error as IdentifyError).status).toBe(529);
    });

    it('throws an IdentifyError when the request itself fails', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
        await expect(
            readCardName(image, { ...options, fetch: fetchMock })
        ).rejects.toBeInstanceOf(IdentifyError);
    });

    it('throws an IdentifyError for a non-JSON reply', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('nope'));
        await expect(
            readCardName(image, { ...options, fetch: fetchMock })
        ).rejects.toBeInstanceOf(IdentifyError);
    });

    it('never puts the key in an error message', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(new Response('{}', { status: 401 }));
        const error = (await readCardName(image, {
            ...options,
            fetch: fetchMock,
        }).catch((e: unknown) => e)) as Error;
        expect(error.message).not.toContain('sk-test-secret');
    });
});
