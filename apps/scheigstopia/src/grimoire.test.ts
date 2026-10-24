import { describe, expect, it } from 'vitest';
import { grimoireOrigin, grimoireRedirects } from './grimoire';

describe('grimoireOrigin', () => {
    it('trims whitespace and trailing slashes', () => {
        expect(grimoireOrigin({ GRIMOIRE_URL: ' https://g.test/ ' })).toBe(
            'https://g.test'
        );
    });

    it('is undefined when unset or blank', () => {
        expect(grimoireOrigin({})).toBeUndefined();
        expect(grimoireOrigin({ GRIMOIRE_URL: ' ' })).toBeUndefined();
    });
});

describe('grimoireRedirects', () => {
    it('sends /grimoire and its subpaths to the same path on Grimoire', () => {
        expect(
            grimoireRedirects({ GRIMOIRE_URL: 'https://g.example.com' })
        ).toEqual([
            {
                source: '/grimoire/:path*',
                destination: 'https://g.example.com/:path*',
                permanent: false,
            },
        ]);
    });

    it('adds nothing when the URL is not set', () => {
        expect(grimoireRedirects({})).toEqual([]);
    });
});
