import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The "no stray values" rule from CLAUDE.md: app and sylva-ui source has no
// hard-coded colors, font sizes or corner radii. Colors come from Sylva tokens,
// type from the typography classes, radii from the radius classes. If a value is missing, add a token or class first.

const repoRoot = path.resolve(__dirname, '../../..');
const roots = [
    'apps/scheigstopia/src',
    'apps/grimoire/src',
    'packages/sylva-ui/src',
];

const SOURCE = /\.(ts|tsx|css)$/;
const TEST_FILE = /\.test\.tsx?$/;

/** Files that define values, or are exempt until the color audit retires them. */
const exemptFiles: Record<string, string> = {
    // Brand pixel art; moves with the logo work (#13).
    'packages/sylva-ui/src/components/GnomeIcon.tsx': 'brand logo (#13)',
    // The type scale is defined here, so it is where the raw sizes live.
    'packages/sylva-ui/src/styles/typography.css': 'type scale',
};

/** Lines exempt in one file: the six site-only colors with no Sylva token yet. */
const siteOnlyColors =
    /^\s*--(surface|surface-hover|border|muted|accent-muted|accent-muted-hover):/;
const exemptLines: Record<string, RegExp> = {
    'packages/sylva-ui/src/styles/colors.css': siteOnlyColors,
};

const rules: { name: string; pattern: RegExp }[] = [
    {
        name: 'hex color',
        // Skips issue references like #110: a color has at least one a-f letter.
        pattern: /#(?=[0-9a-fA-F]*[a-fA-F])[0-9a-fA-F]{3,8}\b/,
    },
    {
        name: 'rgb/hsl/oklch color',
        pattern: /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/i,
    },
    {
        name: 'Tailwind arbitrary color',
        pattern: /\b[a-z-]+-\[(?:#|rgba?\(|hsla?\()/,
    },
    {
        name: 'Tailwind arbitrary text size',
        pattern: /\btext-\[/,
    },
    {
        name: 'raw border radius (use rounded-button, -control, -surface, -thumb or -full)',
        pattern:
            /\brounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl)\b|\brounded-\[/,
    },
    {
        name: 'raw font size',
        pattern: /font-?size\s*[:=]\s*['"`]?\s*(?!var\()[\d.]+|\bclamp\(/i,
    },
];

function sourceFiles(): string[] {
    return roots.flatMap((root) =>
        readdirSync(path.join(repoRoot, root), {
            recursive: true,
            encoding: 'utf8',
        })
            .filter((file) => SOURCE.test(file) && !TEST_FILE.test(file))
            .map((file) =>
                path.posix.join(root, file.split(path.sep).join('/'))
            )
    );
}

function violations(file: string): string[] {
    if (file in exemptFiles) return [];
    const lineExemption = exemptLines[file];
    return readFileSync(path.join(repoRoot, file), 'utf8')
        .split('\n')
        .flatMap((line, i) => {
            if (lineExemption?.test(line)) return [];
            return rules
                .filter(({ pattern }) => pattern.test(line))
                .map(({ name }) => `${file}:${i + 1} ${name}: ${line.trim()}`);
        });
}

describe('no stray values', () => {
    const files = sourceFiles();

    it('finds the source files', () => {
        expect(files.length).toBeGreaterThan(0);
        expect(files).toContain('packages/sylva-ui/src/styles/colors.css');
    });

    it('lists only exemptions that still exist', () => {
        for (const file of Object.keys(exemptFiles)) {
            expect(files).toContain(file);
        }
    });

    it('has no hard-coded colors or font sizes', () => {
        expect(files.flatMap(violations)).toEqual([]);
    });

    describe('rules', () => {
        it.each([
            ['hex color', 'className="bg-[#1b5e20]"'],
            ['hex color', 'color: #fff;'],
            ['rgb/hsl/oklch color', 'color: rgb(0 0 0)'],
            ['Tailwind arbitrary color', 'border-[rgb(1,2,3)]'],
            ['Tailwind arbitrary text size', 'text-[13px]'],
            ['raw font size', 'font-size: 13px;'],
            ['raw font size', 'fontSize: 14'],
            ['raw font size', 'width: clamp(1rem, 2vw, 3rem)'],
        ])('flags %s in %s', (name, line) => {
            const rule = rules.find((r) => r.name === name);
            expect(rule?.pattern.test(line)).toBe(true);
        });

        it.each([
            'Closes #110 and #49',
            'font-size: var(--font-size-base);',
            'className="text-body bg-surface"',
        ])('allows %s', (line) => {
            expect(rules.some(({ pattern }) => pattern.test(line))).toBe(false);
        });
    });
});
