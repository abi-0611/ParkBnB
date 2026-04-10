# ParkNear

Monorepo for **ParkNear** — a Chennai peer-to-peer parking marketplace (React Native / Expo + Next.js + Supabase).

## Structure

- `apps/mobile` — Expo Router app
- `apps/web` — Next.js 14 (App Router)
- `packages/shared` — Shared TypeScript types, Zod schemas, utilities
- `supabase` — Migrations, seed, Edge Functions (later)

## Prerequisites

- Node.js 18+
- pnpm (`npx pnpm` works if pnpm is not installed globally)
- Docker Desktop (for local Supabase: `supabase start` / `supabase db reset`)

## Setup

1. Copy `.env.example` into `apps/web/.env.local` and `apps/mobile/.env` with your Supabase URL and anon key.
2. Enable **PostGIS** on your Supabase project (Database → Extensions) if applying migrations remotely.
3. Apply SQL: `supabase db push` (linked project) or `supabase db reset` (local).
4. Install dependencies: `pnpm install` (from repo root).

## Scripts

- `pnpm dev:web` — Next.js dev server
- `pnpm dev:mobile` — Expo dev server
- `pnpm typecheck` — TypeScript across packages
- `pnpm deploy:web:build` — verify production web build
- `pnpm deploy:mobile:android:preview` — create Android preview APK via EAS
- `pnpm supabase:db:push` — apply migrations to linked Supabase project
- `pnpm supabase:functions:deploy` — deploy all edge functions

## Deployment

- Mobile EAS config: `apps/mobile/eas.json`
- Full runbook: `docs/DEPLOYMENT.md`

## Brand

- Primary: `#0EA5E9` (sky)
- Accent: `#10B981` (emerald)
