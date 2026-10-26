import { describe, expect, it } from 'vitest';
import { siteOrigin } from './siteUrl';

describe('siteOrigin', () => {
    it('trims whitespace and trailing slashes', () => {
        expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: ' https://s.test/ ' })).toBe(
            'https://s.test'
        );
    });

    it('is undefined when unset or blank', () => {
        expect(siteOrigin({})).toBeUndefined();
        expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: ' ' })).toBeUndefined();
    });
});
