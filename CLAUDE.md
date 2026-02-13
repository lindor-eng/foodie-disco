# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Source**: All application code lives in `src/`
- **Routing**: File-based routing under `src/app/` (App Router)
- **Path alias**: `@/*` maps to `src/*`

## Coding Principles

- **KISS** — Keep implementations simple and straightforward. Prefer clarity over cleverness.
- **YAGNI** — Don't add functionality or optimize for performance until it's actually needed.
- **SOLID** — Keep code modular with single-responsibility modules, clear interfaces, and loose coupling.
