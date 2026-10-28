import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.join(__dirname, 'globals.css'), 'utf8');

describe('Grimoire global styles', () => {
    it('turns off the rubber-band bounce on the page', () => {
        expect(css).toMatch(
            /html\s*\{[^}]*overscroll-behavior-y:\s*none;[^}]*\}/
        );
    });
});
