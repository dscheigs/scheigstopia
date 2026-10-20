import { describe, expect, it, vi } from 'vitest';
import { clearOfflineCaches, registerServiceWorker } from '@/lib/offlineCache';

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
