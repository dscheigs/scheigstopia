import { describe, expect, it, vi } from 'vitest';
import {
    canShareFile,
    isStandaloneApp,
    shareExportFile,
} from '@/lib/shareExport';

const csv = (body = 'Name,Quantity\r\n') =>
    new Response(body, { headers: { 'Content-Type': 'text/csv' } });

function abort() {
    const error = new Error('Share canceled');
    error.name = 'AbortError';
    return error;
}

describe('isStandaloneApp', () => {
    it('is true for the display mode or the iOS flag', () => {
        expect(isStandaloneApp(() => ({ matches: true }), {})).toBe(true);
        expect(
            isStandaloneApp(() => ({ matches: false }), { standalone: true })
        ).toBe(true);
    });

    it('is false in a browser tab or without the APIs', () => {
        expect(
            isStandaloneApp(() => ({ matches: false }), { standalone: false })
        ).toBe(false);
        expect(isStandaloneApp(undefined, undefined)).toBe(false);
    });
});

describe('canShareFile', () => {
    it('needs share and canShare, and canShare must accept a file', () => {
        expect(canShareFile(undefined, 'text/csv')).toBe(false);
        expect(canShareFile({ share: vi.fn() }, 'text/csv')).toBe(false);
        expect(
            canShareFile({ share: vi.fn(), canShare: () => false }, 'text/csv')
        ).toBe(false);
        expect(
            canShareFile({ share: vi.fn(), canShare: () => true }, 'text/csv')
        ).toBe(true);
    });

    it('asks about a file of the given type', () => {
        const canShare = vi.fn().mockReturnValue(true);
        canShareFile({ share: vi.fn(), canShare }, 'text/csv');
        const files = canShare.mock.calls[0][0].files as File[];
        expect(files).toHaveLength(1);
        expect(files[0].type).toBe('text/csv');
    });

    it('is false when canShare throws', () => {
        const canShare = () => {
            throw new TypeError('unsupported');
        };
        expect(canShareFile({ share: vi.fn(), canShare }, 'text/csv')).toBe(
            false
        );
    });
});

describe('shareExportFile', () => {
    const options = {
        url: '/grimoire/api/export?format=csv',
        filename: 'grimoire-collection.csv',
        type: 'text/csv',
    };

    it('fetches the export and shares it as a named file', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        const fetchFn = vi.fn().mockResolvedValue(csv('Name\r\nSol Ring\r\n'));
        const result = await shareExportFile({
            ...options,
            nav: { share },
            fetchFn,
        });
        expect(result).toBe('shared');
        expect(fetchFn).toHaveBeenCalledWith(options.url);
        const data = share.mock.calls[0][0] as ShareData;
        const file = data.files?.[0] as File;
        expect(file.name).toBe('grimoire-collection.csv');
        expect(file.type).toBe('text/csv');
        expect(await file.text()).toBe('Name\r\nSol Ring\r\n');
    });

    it('treats closing the share sheet as cancelled, not as a failure', async () => {
        const share = vi.fn().mockRejectedValue(abort());
        expect(
            await shareExportFile({
                ...options,
                nav: { share },
                fetchFn: async () => csv(),
            })
        ).toBe('cancelled');
    });

    it('fails when the share is refused', async () => {
        const refused = new Error('not allowed');
        refused.name = 'NotAllowedError';
        expect(
            await shareExportFile({
                ...options,
                nav: { share: vi.fn().mockRejectedValue(refused) },
                fetchFn: async () => csv(),
            })
        ).toBe('failed');
    });

    it('fails without sharing when the export is not available', async () => {
        const share = vi.fn();
        expect(
            await shareExportFile({
                ...options,
                nav: { share },
                fetchFn: async () => new Response('{}', { status: 401 }),
            })
        ).toBe('failed');
        expect(share).not.toHaveBeenCalled();
    });

    it('fails when the request itself fails', async () => {
        expect(
            await shareExportFile({
                ...options,
                nav: { share: vi.fn() },
                fetchFn: async () => {
                    throw new TypeError('Load failed');
                },
            })
        ).toBe('failed');
    });
});
