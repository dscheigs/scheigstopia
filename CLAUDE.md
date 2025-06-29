# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with TypeScript, using the App Router architecture. The project uses Tailwind CSS for styling and includes comprehensive tooling for code quality and consistency.

## Development Commands

- `yarn dev` - Start development server with Turbopack for faster builds
- `yarn build` - Build the application for production
- `yarn start` - Start the production server
- `yarn lint` - Run Next.js linter to check code quality
- `yarn lint:fix` - Auto-fix linting issues
- `yarn type-check` - Check TypeScript without building
- `yarn format` - Format all files with Prettier
- `yarn format:check` - Check if files are formatted
- `yarn clean` - Clean build artifacts and cache

## Code Quality & Git Workflow

The project enforces code quality through:

- **Pre-commit hooks**: Automatically runs `lint-staged` which formats code with Prettier and lints TypeScript/JavaScript files with Next.js linter (includes Next.js-specific rules)
- **Commit message convention**: All commits must follow conventional commit format: `<type>: <description>` where type is one of: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
- **Automatic formatting**: Prettier formats all files on commit, Next.js linter fixes auto-fixable issues and enforces Next.js best practices

## Architecture

- **App Router**: Uses Next.js 13+ App Router with layout components in `src/app/`
- **Styling**: Tailwind CSS with CSS custom properties for theming (Inter & JetBrains Mono fonts)
- **TypeScript**: Configured with strict mode and path aliases (`@/*` maps to `./src/*`)
- **Import aliases**: Use `@/` prefix for imports from the src directory

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

- `src/styles/globals.css` - Main imports and body styles
- `src/styles/colors.css` - Color system and variables
- `src/styles/typography.css` - Font system and typography classes

## Color System & Design Philosophy

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
