# ParkNear

ParkNear is a monorepo for a peer-to-peer parking marketplace:

- `apps/web`: Next.js App Router web app
- `apps/mobile`: Expo Router mobile app
- `packages/shared`: shared types, schemas, and utilities
- `supabase`: SQL migrations and backend configuration

---

## Tech Stack

- Node.js + pnpm workspaces
- Next.js 14 (web)
- Expo / React Native (mobile)
- Supabase (Postgres, Auth, Storage, Realtime)
- Auth.js (web authentication)
- Mapbox (maps/static maps)
- Razorpay (payments)

---

## 1) Clone And Bootstrap From Scratch

### Prerequisites

- Node.js 20 LTS (recommended; minimum 18)
- pnpm 9+
- Git
- Optional for local DB: Docker Desktop + Supabase CLI
- Optional for mobile builds: Expo account + EAS CLI

### Clone

```bash
git clone <your-github-repo-url>
cd ParkBNB
```

### Install dependencies

```bash
pnpm install
```

---

## 2) Environment Setup

Use `.env.example` at repo root as the source of truth.

### Web (`apps/web/.env.local`)

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only routes/actions)

Common optional variables:

- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_ACCESS_TOKEN` (CLI automation)
- `CRON_SECRET`

### Mobile (`apps/mobile/.env`)

Required:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `EXPO_PUBLIC_MAPBOX_TOKEN`

### Quick copy flow

macOS/Linux:

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env
```

Windows PowerShell:

```powershell
Copy-Item .env.example apps/web/.env.local
Copy-Item .env.example apps/mobile/.env
```

Then edit both files and keep only the relevant variable names per app.

---

## 3) Database Setup (Supabase)

### Option A: Use hosted Supabase project

1. Create/link your Supabase project.
2. Ensure PostGIS extension is available.
3. Apply migrations:

```bash
pnpm supabase:db:push
```

### Option B: Local Supabase with Docker

```bash
supabase start
supabase db reset
```

If OTP/login behavior is inconsistent in local auth, review `supabase/config.toml` for OTP and rate-limit settings.

---

## 4) Run The Apps Locally

### Web

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000)

### Mobile

```bash
pnpm dev:mobile
```

Use Expo Go / emulator / simulator to open the app.

Windows note for mobile tooling:

- Install Android Studio for emulator support.
- If using physical device + Expo Go, ensure phone and dev machine are on the same network.

---

## 5) Quality Checks

```bash
pnpm typecheck
pnpm --filter web lint
pnpm deploy:web:build
```

---

## 6) Deployment Commands

- `pnpm deploy:web:build` - production build verification for web
- `pnpm deploy:mobile:android:preview` - EAS preview APK
- `pnpm supabase:db:push` - push DB migrations
- `pnpm supabase:functions:deploy` - deploy Supabase edge functions

See `docs/DEPLOYMENT.md` for the full runbook.

---

## 7) CI/CD (GitHub Actions)

This repository includes:

- `CI`: install, typecheck, lint, and web build on push/PR
- `Deploy Web`: Vercel deployment workflow
- `Deploy Mobile Preview`: EAS Android preview workflow

Set these GitHub repository secrets before using deploy workflows:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `EXPO_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN` (optional but recommended)
- `RAZORPAY_KEY_ID` (if required by your build/runtime checks)

Recommended repository settings:

- Protect `main` and require the `CI` workflow to pass before merge.
- Keep deploy workflows as `workflow_dispatch` for controlled releases, or use `push` on `main` only.

---

## 8) Workspace Layout

```text
apps/
  mobile/        # Expo app
  web/           # Next.js app
packages/
  shared/        # Shared TS package
supabase/        # Migrations/config
docs/            # Runbooks and docs
```

---

## Notes

- Do not commit real env files or secrets.
- `.next/` and other build artifacts should stay untracked.
- Keep dependency upgrades conservative around Expo/Next major versions unless doing a planned migration.
