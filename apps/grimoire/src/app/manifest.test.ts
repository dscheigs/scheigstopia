import { describe, expect, it } from 'vitest';
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

    it('starts at and covers the origin root', () => {
        const m = manifest();
        expect(m.start_url).toBe('/');
        expect(m.scope).toBe('/');
        expect(m.id).toBe('/');
        expect(m.icons?.[0].src).toBe('/icons/icon-192.png');
    });
});
