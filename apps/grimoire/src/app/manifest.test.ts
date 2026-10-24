import { afterEach, describe, expect, it, vi } from 'vitest';
import manifest from '@/app/manifest';

describe('manifest', () => {
    it('installs as a standalone app with an any and a maskable icon', () => {
        const m = manifest();
        expect(m.display).toBe('standalone');
        expect(m.start_url).toBe(m.scope);
        expect(m.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
        expect(m.icons?.some((icon) => icon.sizes === '512x512')).toBe(true);
    });

    it('takes its colors from Sylva rather than a literal', () => {
        const m = manifest();
        expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(m.theme_color).toBe(m.background_color);
    });

    describe('mounted under a base path', () => {
        afterEach(() => {
            vi.unstubAllEnvs();
            vi.resetModules();
        });

        it('starts at the base path itself, which Next serves without a redirect', async () => {
            vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/grimoire');
            vi.resetModules();
            const { default: mounted } = await import('@/app/manifest');
            const m = mounted();
            expect(m.start_url).toBe('/grimoire');
            expect(m.scope).toBe('/grimoire');
            expect(m.id).toBe('/grimoire');
            expect(m.icons?.[0].src).toBe('/grimoire/icons/icon-192.png');
        });
    });
});
