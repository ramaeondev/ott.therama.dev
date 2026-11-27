# OTT Radar

India-focused cinema and streaming release discovery. This repository contains the React, Vite and TypeScript frontend for `ott.therama.dev`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The dashboard currently uses sample release cards when the `/ott/releases` endpoint is unavailable or has no rows. The sample cards are UI placeholders, not real release announcements. The browser calls only public `/ott/releases`; ingestion and provider credentials stay in the backend repository and server environment.

## End-to-end tests

```sh
npx playwright install chromium
npm run test:e2e
```

The Playwright suite starts Vite on port 4173 and stubs release responses so UI tests do not depend on live data. It covers release loading, category filters, search, navigation, and a roadmap gap audit.

## Backend

The database migrations and ingestion API live only in the `api.therama.dev` repository. The public API returns India theatrical releases marked `API_REPORTED` or `VERIFIED`; pending RSS items remain unpublished. The platform endpoint includes candidate services with explicit verification and India-availability fields.

Huginn remains the collection/orchestration system. OTT RSS entries are preserved as raw source items; TMDB supplies theatrical candidates and Watchmode checks India availability. Release verification and full OTT premiere matching remain gaps for later implementation.
