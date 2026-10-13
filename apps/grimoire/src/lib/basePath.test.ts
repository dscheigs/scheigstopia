import { describe, expect, it } from 'vitest';
import { normalizeBasePath, withBasePath } from '@/lib/basePath';

describe('normalizeBasePath', () => {
    it('is empty when unset or blank', () => {
        expect(normalizeBasePath(undefined)).toBe('');
        expect(normalizeBasePath('')).toBe('');
        expect(normalizeBasePath(' / ')).toBe('');
    });

    it('adds the leading slash and drops the trailing one', () => {
        expect(normalizeBasePath('grimoire')).toBe('/grimoire');
        expect(normalizeBasePath('/grimoire/')).toBe('/grimoire');
    });
});

describe('withBasePath', () => {
    it('leaves paths alone when standalone', () => {
        expect(withBasePath('/api/export', '')).toBe('/api/export');
    });

    it('prefixes app paths when mounted', () => {
        expect(withBasePath('/api/export', '/grimoire')).toBe(
            '/grimoire/api/export'
        );
        expect(withBasePath('/signin', '/grimoire')).toBe('/grimoire/signin');
    });

    it('leaves full URLs and protocol-relative URLs alone', () => {
        expect(withBasePath('https://x.test/a', '/grimoire')).toBe(
            'https://x.test/a'
        );
        expect(withBasePath('//x.test/a', '/grimoire')).toBe('//x.test/a');
    });
});
