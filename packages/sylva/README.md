# @scheigs/sylva

A small, reusable **color system** — a forest-green and sage palette as
[W3C design tokens](https://tr.designtokens.org/format/).

Colors only. No components, no framework.

## Install

```bash
pnpm add @scheigs/sylva
```

## Use

**CSS custom properties** (themed — `:root` is light, dark via
`prefers-color-scheme` and `[data-theme="dark"]`):

```css
@import '@scheigs/sylva/css';

.card {
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
}
```

**JS / TS constants** (resolved values, nested):

```ts
import tokens from '@scheigs/sylva';

tokens.color.green[800]; // "#1b5e20"
tokens.color.light.bg.canvas; // "#e9eadc"
```

**Raw DTCG tokens** — feed your own transform, Figma, Tokens Studio, etc.:

```ts
import primitives from '@scheigs/sylva/tokens/primitives';
import semantic from '@scheigs/sylva/tokens/semantic';
```

## Layout

```
tokens/
  primitives.tokens.json   Tier 1 — raw palette (green, sage, neutral, feedback, base)
  semantic.tokens.json     Tier 2 — aliases (bg / text / border / action / feedback), per theme
brand/
  gnome.svg                The mascot — standalone pixel SVG
build.mjs                  Style Dictionary build -> dist/
```

`dist/` (git-ignored, built on `nx build sylva` and before publish):

```
sylva.css            themed CSS custom properties
sylva.js  sylva.d.ts nested resolved values + types
sylva.tokens.json    the same, as JSON
```

## Two tiers

**Primitives** are raw values with no assigned meaning — full `50–950` ramps for
`green` (brand) and `sage` (muted green-grey), a hue-free `neutral` scale, and
`success` / `warning` / `error` / `info`.

**Semantic** tokens are what an app consumes. Each is a reference such as
`{color.green.800}`, split into `light` and `dark` groups that mirror each other.
The build drops the theme segment, so `color.light.bg.canvas` and
`color.dark.bg.canvas` both become `--color-bg-canvas`, swapped by theme.

## Brand mark

`brand/gnome.svg` is the gnome mascot — a 14×23 grid of flat `<rect>`s
(`shape-rendering="crispEdges"`), scales sharp to any size. Its colors are its
own and sit **outside** the token system.

## License

MIT — see [LICENSE](./LICENSE).
