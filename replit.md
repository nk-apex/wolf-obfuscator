# WOLF-OBFUSCATOR

## Overview

WOLF-OBFUSCATOR is a client-side code obfuscation tool built as a full-stack web application. It provides multi-language code obfuscation (JavaScript, CSS, HTML, Batch/Shell) with advanced techniques like string encryption, control flow flattening, dead code injection, identifier mangling, self-defending code, and domain locking. The obfuscation logic runs entirely in the browser — the server primarily serves the frontend and provides a minimal API layer.

The visual design follows a dark/hacker aesthetic with neon green (`#00ff00`) and magenta (`#ff00ff`) accents, glass-morphism cards, monospace fonts, and glow effects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)
- **Location**: `client/` directory
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Uses `wouter` for lightweight client-side routing
- **State/Data**: `@tanstack/react-query` for server state management
- **UI Components**: Full shadcn/ui component library (new-york style) in `client/src/components/ui/`
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode with custom green/magenta color scheme defined in `client/src/index.css`. Monospace fonts (JetBrains Mono, Fira Code, Geist Mono).
- **Core Logic**: The obfuscation engine lives in `client/src/lib/obfuscator.ts` — all obfuscation happens client-side with custom Base64 encoding, XOR encryption, and multi-round transformations
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend (Express)
- **Location**: `server/` directory
- **Framework**: Express 5 running on Node.js with TypeScript (via `tsx`)
- **Entry point**: `server/index.ts` creates an HTTP server, registers routes, and serves static files or Vite dev middleware
- **API routes**: Defined in `server/routes.ts`, prefixed with `/api`. Currently minimal — the app is primarily frontend-driven
- **Dev mode**: Vite dev server runs as middleware (`server/vite.ts`) with HMR support
- **Production**: Client is built to `dist/public/`, server is bundled via esbuild to `dist/index.cjs`

### Shared Code
- **Location**: `shared/` directory
- **Schema**: `shared/schema.ts` defines database tables and Zod validation schemas using Drizzle ORM
- **Current schema**: A `users` table with `id` (UUID), `username`, and `password` fields

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL (`drizzle.config.ts`)
- **Current storage**: `server/storage.ts` implements an in-memory storage (`MemStorage`) with a `Map` — this is a placeholder that should be replaced with Drizzle/PostgreSQL queries when a database is provisioned
- **Database URL**: Expects `DATABASE_URL` environment variable for PostgreSQL connection
- **Migrations**: Output to `./migrations/` directory, schema push via `npm run db:push`

### Build System
- **Dev**: `npm run dev` — runs `tsx server/index.ts` with Vite middleware for HMR
- **Build**: `npm run build` — runs `script/build.ts` which builds the client with Vite and bundles the server with esbuild
- **Production**: `npm start` — runs the bundled `dist/index.cjs`
- **Type checking**: `npm run check` — runs `tsc` with no emit

### Key Design Decisions
1. **Client-side obfuscation**: All code transformation happens in the browser to avoid sending sensitive source code to a server. This is a deliberate security/privacy choice.
2. **In-memory storage as default**: The `MemStorage` class allows the app to run without a database. When PostgreSQL is available, swap to a Drizzle-based implementation.
3. **Monorepo structure**: Client, server, and shared code coexist in one repo with TypeScript path aliases for clean imports.
4. **shadcn/ui components**: Pre-installed comprehensive UI component library — use these existing components rather than installing new UI libraries.

## External Dependencies

### Database
- **PostgreSQL** via Drizzle ORM — requires `DATABASE_URL` environment variable
- **Session store**: `connect-pg-simple` is available for PostgreSQL-backed sessions

### Key npm Packages
- **Frontend**: React, Vite, wouter, @tanstack/react-query, tailwindcss, shadcn/ui (Radix primitives + CVA), lucide-react icons, recharts, embla-carousel, react-hook-form, zod
- **Backend**: Express 5, drizzle-orm, drizzle-zod, express-session, passport, nanoid
- **Build**: esbuild, tsx, drizzle-kit

### Replit-specific
- `@replit/vite-plugin-runtime-error-modal` — runtime error overlay in dev
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` — dev-only Replit integrations (conditionally loaded)

### Fonts (External)
- Google Fonts: JetBrains Mono, Fira Code, Geist Mono, DM Sans, Architects Daughter