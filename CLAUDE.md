# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with TypeScript, using the App Router architecture. The project uses Tailwind CSS for styling and includes comprehensive tooling for code quality and consistency.

## Development Commands

- `yarn dev` - Start development server with Turbopack for faster builds
- `yarn build` - Build the application for production
- `yarn start` - Start the production server
- `yarn lint` - Run ESLint to check code quality

## Code Quality & Git Workflow

The project enforces code quality through:

- **Pre-commit hooks**: Automatically runs `lint-staged` which formats code with Prettier and lints TypeScript/JavaScript files with ESLint
- **Commit message convention**: All commits must follow conventional commit format: `<type>: <description>` where type is one of: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
- **Automatic formatting**: Prettier formats all files on commit, ESLint fixes auto-fixable issues

## Architecture

- **App Router**: Uses Next.js 13+ App Router with layout components in `src/app/`
- **Styling**: Tailwind CSS with CSS custom properties for theming (Geist fonts)
- **TypeScript**: Configured with strict mode and path aliases (`@/*` maps to `./src/*`)
- **Import aliases**: Use `@/` prefix for imports from the src directory
