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
