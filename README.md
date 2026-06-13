# MTOS

MTOS, or Monthly Touch OS, is a Supabase-first client success operating system for agencies and service businesses. It helps account teams prepare for recurring client meetings, monitor churn risk, capture opportunities, and turn conversations into accountable follow-up work.

## What Is Included

- Next.js 16 App Router application in `src/app`
- Supabase-backed auth and server data access in `src/lib/supabase`
- MTOS workspace domain layer in `src/lib/mtos-data.ts`
- Expanded Supabase schema in `supabase/migrations/0003_mtos_workspace.sql`
- ClickUp connector routes under `src/app/api/connectors/clickup`
- AI meeting brief route grounded in client context under `src/app/api/ai/meeting-brief`

## Rebuild Highlights

- Replaced hard-coded dashboard mock content with a shared MTOS workspace model
- Added a Supabase migration for meetings, action items, client signals, opportunities, and wiki documents
- Turned the dashboard, clients, overview, timeline, churn, and settings pages into data-driven operator surfaces
- Grounded AI meeting brief generation with real client context and a deterministic fallback response
- Added demo workspace fallback so the app still runs cleanly before Supabase is fully seeded

## Run Locally

1. Install dependencies:

```bash
npm ci
```

2. Configure environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPER_ADMIN_EMAIL=you@example.com
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

3. Apply the Supabase migrations, including `0003_mtos_workspace.sql`.

4. Start the app:

```bash
npm run dev
```

5. Verify production readiness:

```bash
npm run lint
npm run build
```

## Notes

- The app intentionally uses `Supabase` only for data and auth. No MongoDB is used in this workspace.
- If Supabase tables or credentials are not ready yet, MTOS falls back to a demo workspace so core pages still render.
