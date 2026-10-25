import { describe, expect, it, vi } from 'vitest';
import {
    clearOfflineCaches,
    registerServiceWorker,
    unregisterServiceWorkers,
} from '@/lib/offlineCache';

describe('registerServiceWorker', () => {
    it('registers the script with the scope', async () => {
        const register = vi.fn().mockResolvedValue({});
        expect(
            await registerServiceWorker('/grimoire/sw.js', '/grimoire/', {
                register,
            })
        ).toBe(true);
        expect(register).toHaveBeenCalledWith('/grimoire/sw.js', {
            scope: '/grimoire/',
        });
    });

    it('is false without service worker support or when registering fails', async () => {
        expect(await registerServiceWorker('/sw.js', '/', undefined)).toBe(
            false
        );
        const register = vi.fn().mockRejectedValue(new Error('blocked'));
        expect(await registerServiceWorker('/sw.js', '/', { register })).toBe(
            false
        );
    });
});

describe('unregisterServiceWorkers', () => {
    it('unregisters every registration', async () => {
        const first = vi.fn().mockResolvedValue(true);
        const second = vi.fn().mockResolvedValue(true);
        await unregisterServiceWorkers({
            getRegistrations: async () =>
                [{ unregister: first }, { unregister: second }] as never,
        });
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('does nothing without support, and swallows errors', async () => {
        await expect(
            unregisterServiceWorkers(undefined)
        ).resolves.toBeUndefined();
        await expect(
            unregisterServiceWorkers({
                getRegistrations: async () => {
                    throw new Error('blocked');
                },
            })
        ).resolves.toBeUndefined();
    });
});

describe('clearOfflineCaches', () => {
    it('deletes only this app’s caches', async () => {
        const del = vi.fn().mockResolvedValue(true);
        await clearOfflineCaches({
            keys: async () => ['grimoire-pages-v1', 'other-cache'],
            delete: del,
        });
        expect(del).toHaveBeenCalledTimes(1);
        expect(del).toHaveBeenCalledWith('grimoire-pages-v1');
    });

    it('does nothing without cache storage', async () => {
        await expect(clearOfflineCaches(undefined)).resolves.toBeUndefined();
    });
});
