// Regenerates the PWA icons from the Sylva gnome on the Sylva canvas color.
// Run from the repo root: node apps/grimoire/scripts/makeIcons.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// sharp is installed with Next.js; it is not a direct dependency of the repo.
const sharp = createRequire(import.meta.url)('sharp');

const tokens = JSON.parse(
    readFileSync('packages/sylva/tokens/primitives.tokens.json', 'utf8')
);
const background = tokens.color.base['canvas-light'].$value;
const gnome = readFileSync('packages/sylva/brand/gnome.svg');
const out = 'apps/grimoire/public/icons';
mkdirSync(out, { recursive: true });

// [file, canvas size, gnome height]. The maskable icon keeps the gnome inside
// the central safe zone so a round or squircle mask never clips it.
const icons = [
    ['icon-192.png', 192, 140],
    ['icon-512.png', 512, 380],
    ['icon-maskable-512.png', 512, 300],
    ['apple-touch-icon.png', 180, 130],
];

for (const [file, size, height] of icons) {
    const art = await sharp(gnome, { density: 1200 })
        // Nearest neighbour keeps the pixel art crisp.
        .resize({ height, kernel: 'nearest' })
        .png()
        .toBuffer();
    await sharp({
        create: { width: size, height: size, channels: 4, background },
    })
        .composite([{ input: art, gravity: 'center' }])
        .png()
        .toFile(`${out}/${file}`);
}
