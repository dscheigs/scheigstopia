# Design guide

Colors, typography and the no-stray-values rule for the apps in this repo. `CLAUDE.md` links here.

## No stray values (hard rule)

Never hard-code a design value in app code:

- No hex, rgb or hsl colors, and no Tailwind arbitrary colors like `bg-[#1b5e20]`.
- No raw font sizes (px, rem, clamp) and no arbitrary sizes like `text-[13px]`.

Colors come from Sylva tokens through the Tailwind classes mapped to them (see Color
System). Type comes from the typography classes below. If the value you need doesn't
exist, add the token or class first and say so in the PR; don't hard-code around it.

Exception, until the color audit retires it: the six site-only colors in
`apps/scheigstopia/src/styles/colors.css` (listed under Color System), which Grimoire's
`colors.css` repeats. Sylva's token files are where values are defined. This file states the rule; a CI check to enforce it is planned (#49), and
until then it is enforced in review.

## Typography System

The project uses custom typography classes with responsive clamp() sizing. **ALWAYS use these classes instead of Tailwind's default text sizing:**

### Typography Classes (Required Usage)

- `text-hero` - Largest text for hero sections (40-60px, bold)
- `text-page-title` - Page titles (32-48px, bold)
- `text-section-title` - Major section headings (28-36px, semibold)
- `text-heading` - Standard headings (24-30px, semibold)
- `text-subheading` - Subheadings (20-24px, medium)
- `text-lead` - Introduction/lead paragraphs (18-20px, normal)
- `text-body` - Regular body text (14-16px, normal)
- `text-caption` - Small text, captions, metadata (13-14px, light)

### Fonts

- **Sans-serif**: Inter (main font)
- **Monospace**: JetBrains Mono (code blocks)

### CSS Organization

- `apps/scheigstopia/src/styles/globals.css` - Main imports and body styles
- `apps/scheigstopia/src/styles/colors.css` - Color system and variables
- `apps/scheigstopia/src/styles/typography.css` - Font system and typography classes

## Color System & Design Philosophy

### Where the values come from

Each app's `colors.css` imports Sylva (`@scheigs/sylva/css`) and points its variable
names at Sylva tokens wherever the colors match exactly: background, foreground,
the primary/accent greens, the neutral scale, the minimal surface colors and
success/warning/error. These are still literal values, because Sylva has no
matching token yet: `--surface`, `--surface-hover`, `--border`, `--muted`,
`--accent-muted`, `--accent-muted-hover`. To change a shared color, edit Sylva's
tokens rather than `colors.css`. Keep the variable names; the Tailwind classes below
depend on them.

The project follows a **minimalistic color approach** with strategic use of color:

### Design Philosophy

- **Minimal body colors**: Content areas (cards, modals, forms) use neutral black/white/gray colors
- **Accent colors for navigation**: Headers, navigation, and primary actions use the green theme
- **Clean contrast**: High contrast between text and backgrounds for readability
- **Consistent neutrals**: Use the defined neutral scale for all non-accent elements

### Color Usage Guidelines

**ALWAYS use these neutral colors for content:**

- `bg-surface-minimal` - Main surface backgrounds (cards, modals)
- `bg-surface-minimal-hover` - Hover states for surfaces
- `border-border-minimal` - Borders for content containers
- `text-text-minimal` - Subdued text (descriptions, secondary content)
- `bg-neutral-*` classes - For buttons, tags, and UI elements

**Use theme colors ONLY for:**

- Navigation headers
- Primary action buttons
- Active states in navigation
- Brand elements

### Available Neutral Colors

```css
--neutral-50: #fafafa (lightest) --neutral-100: #f5f5f5 --neutral-200: #e5e5e5
    --neutral-300: #d4d4d4 --neutral-400: #a3a3a3 --neutral-500: #737373
    --neutral-600: #525252 --neutral-700: #404040 --neutral-800: #262626
    --neutral-900: #171717 --neutral-950: #0a0a0a (darkest);
```

### Semantic Color Variables

- `--surface-minimal` - Auto-adjusting surface for light/dark mode
- `--surface-minimal-hover` - Hover state for minimal surfaces
- `--border-minimal` - Neutral borders
- `--text-minimal` - Subdued text color

**Example Usage:**

```tsx
// ✅ Good - Content with minimal colors
<div className="bg-surface-minimal border border-border-minimal">
  <p className="text-text-minimal">Description text</p>
  <button className="bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900">
    Action
  </button>
</div>

// ❌ Avoid - Using theme colors for content
<div className="bg-surface border border-border">
  <p className="text-muted">Description text</p>
</div>
```
