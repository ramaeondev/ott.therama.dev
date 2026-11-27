# OTT Radar

India-focused cinema and streaming release discovery. This repository contains the React, Vite and TypeScript frontend for `ott.therama.dev`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The UI reads public endpoints from `api-v3.therama.dev/ott/`. Release pages use `/ott/releases`, the platform directory uses `/ott/platforms`, and the public Announcements page uses `/ott/announcements`. RSS announcements are deduplicated and labeled as news items; their article dates are never treated as release dates. Ingestion and provider credentials stay in the backend repository and server environment.

## End-to-end tests

```sh
npx playwright install chromium
npm run test:e2e
```

The Playwright suite starts Vite on port 4173 and stubs API responses so UI tests do not depend on live data. It covers release pages, status-label suppression, search, calendar views, platforms, RSS announcements, responsive navigation, and unknown routes.

## Backend

The database migrations and ingestion API live only in the `api.therama.dev` repository. The public API returns India release records marked `API_REPORTED` or `VERIFIED`; RSS items appear in a separate deduplicated announcements feed. The platform endpoint includes candidate services with explicit verification and India-availability fields.

Huginn remains the collection/orchestration system. OTT RSS entries are preserved as raw source items and duplicate copies are merged in the public feed. TMDB supplies theatrical candidates and Watchmode checks India availability. Release verification and full OTT premiere matching remain gaps for later implementation.
