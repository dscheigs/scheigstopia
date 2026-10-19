import { describe, expect, it } from 'vitest';
import { zoneRewrites } from './zones';

const zones = [{ path: '/grimoire', urlEnv: 'GRIMOIRE_URL' }];

describe('zoneRewrites', () => {
    it('proxies the path and everything under it', () => {
        expect(
            zoneRewrites({ GRIMOIRE_URL: 'https://g.example.com' }, zones)
        ).toEqual([
            {
                source: '/grimoire',
                destination: 'https://g.example.com/grimoire',
            },
            {
                source: '/grimoire/:path*',
                destination: 'https://g.example.com/grimoire/:path*',
            },
        ]);
    });

    it('ignores a trailing slash on the URL', () => {
        const [first] = zoneRewrites(
            { GRIMOIRE_URL: 'https://g.test/' },
            zones
        );
        expect(first.destination).toBe('https://g.test/grimoire');
    });

    it('skips a zone whose URL is unset or blank', () => {
        expect(zoneRewrites({}, zones)).toEqual([]);
        expect(zoneRewrites({ GRIMOIRE_URL: ' ' }, zones)).toEqual([]);
    });
});
