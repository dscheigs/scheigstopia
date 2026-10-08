import { describe, expect, it } from 'vitest';
import { isAllowedGithubUser } from '@/lib/access';

describe('isAllowedGithubUser', () => {
    it('allows only the configured numeric id', () => {
        expect(isAllowedGithubUser(12345, '12345')).toBe(true);
        expect(isAllowedGithubUser('12345', '12345')).toBe(true);
        expect(isAllowedGithubUser(12346, '12345')).toBe(false);
    });

    it('fails closed when the setting is missing or malformed', () => {
        expect(isAllowedGithubUser(12345, undefined)).toBe(false);
        expect(isAllowedGithubUser(12345, '')).toBe(false);
        expect(isAllowedGithubUser(0, '0')).toBe(false);
        expect(isAllowedGithubUser(12345, 'dscheigs')).toBe(false);
        expect(isAllowedGithubUser(12345, '12345abc')).toBe(false);
        expect(isAllowedGithubUser(12345, '-12345')).toBe(false);
    });

    it('rejects a missing or non-numeric account id', () => {
        expect(isAllowedGithubUser(undefined, '12345')).toBe(false);
        expect(isAllowedGithubUser(null, '12345')).toBe(false);
        expect(isAllowedGithubUser('dscheigs', '12345')).toBe(false);
        expect(isAllowedGithubUser({ id: 12345 }, '12345')).toBe(false);
    });
});
