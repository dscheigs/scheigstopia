import { describe, expect, it } from 'vitest';
import { linkKind, SITE_HOME_HREF } from './navItems';

describe('linkKind', () => {
    it('renders a plain anchor by default, so a cross-zone link cannot hang', () => {
        expect(linkKind({})).toBe('anchor');
        expect(linkKind({ sameApp: undefined })).toBe('anchor');
        expect(linkKind({ sameApp: false })).toBe('anchor');
    });

    it('renders a client-side link only when the item opts in as same-app', () => {
        expect(linkKind({ sameApp: true })).toBe('link');
    });
});

describe('SITE_HOME_HREF', () => {
    it('is the site root, never an app path', () => {
        expect(SITE_HOME_HREF).toBe('/');
    });
});
