// Regenerates the PWA icons from the Grimoire gnome on the Sylva canvas color.
// Run from the repo root: node apps/grimoire/scripts/makeIcons.mjs
//
// The art is read from the rect list in GnomeIcon.tsx (the gnome plus the
// `grimoire` variant's book), so the icons cannot drift from the component.
// This file holds no colors of its own.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// sharp is installed with Next.js; it is not a direct dependency of the repo.
const sharp = createRequire(import.meta.url)('sharp');

const tokens = JSON.parse(
    readFileSync('packages/sylva/tokens/primitives.tokens.json', 'utf8')
);
const background = tokens.color.base['canvas-light'].$value;

const source = readFileSync(
    'packages/sylva-ui/src/components/GnomeIcon.tsx',
    'utf8'
);
const [, gridWidth, gridHeight] = source.match(/viewBox="0 0 (\d+) (\d+)"/);
// Document order is paint order: the plain gnome first, the book on top.
const rects = [...source.matchAll(/<rect\s+([^>]*?)\/>/g)].map(([, attrs]) => {
    const read = (name) =>
        attrs.match(new RegExp(`${name}="\\s*([^"]*?)\\s*"`))[1];
    return `<rect x="${read('x')}" y="${read('y')}" width="${read('width')}" height="${read('height')}" fill="${read('fill')}"/>`;
});
if (rects.length < 100 || !source.includes('data-variant="grimoire"')) {
    throw new Error(
        'GnomeIcon.tsx no longer looks like the expected rect grid'
    );
}

// Renders the grid at a whole-number pixel scale, so every cell is the same
// size and the edges stay crisp.
function gnomeAt(scale) {
    const w = gridWidth * scale;
    const h = gridHeight * scale;
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
        `viewBox="0 0 ${gridWidth} ${gridHeight}" shape-rendering="crispEdges">` +
        rects.join('') +
        '</svg>';
    return sharp(Buffer.from(svg), { density: 72 }).png().toBuffer();
}

const out = 'apps/grimoire/public/icons';
mkdirSync(out, { recursive: true });

// [file, canvas size, pixels per gnome cell]. The maskable icon keeps the whole
// gnome inside the central 80% circle so a round or squircle mask never clips it.
const icons = [
    ['icon-192.png', 192, 6],
    ['icon-512.png', 512, 16],
    ['icon-maskable-512.png', 512, 14],
    ['apple-touch-icon.png', 180, 6],
];

for (const [file, size, scale] of icons) {
    await sharp({
        create: { width: size, height: size, channels: 4, background },
    })
        .composite([{ input: await gnomeAt(scale), gravity: 'center' }])
        .png()
        .toFile(`${out}/${file}`);
}
