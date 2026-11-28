# OTT Radar

India-focused cinema and streaming release discovery. This repository contains the React, Vite and TypeScript frontend for `ott.therama.dev`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The UI reads public endpoints from `ott-api.therama.dev` (the ott-ingest repository, set by `VITE_OTT_API_URL`). Release pages combine `/api/v1/movies/now-showing` and `/api/v1/movies/coming-soon`, the platform directory uses `/api/v1/ott-platforms`, and the Announcements page uses `/ott/announcements`. Announcements are published as soon as they are collected (no review step); every article is listed, and each carries the title, platform and streaming date AI found in it. An article's publication date is never treated as a release date.

## End-to-end tests

```sh
npx playwright install chromium
npm run test:e2e
```

The Playwright suite starts Vite on port 4173 and stubs API responses so UI tests do not depend on live data. It covers release pages, status-label suppression, search, calendar views, platforms, RSS announcements, responsive navigation, and unknown routes.

## Backend

The database, migrations, Huginn feed setup and AI analysis (DeepSeek, with Claude as a backup) live in the private `ott-ingest` repository.

Huginn remains the collection/orchestration system. OTT RSS entries are preserved as raw source items and every article is listed (the same story from several feeds is shown with an "Also in N other feeds" tag, not hidden). TMDB supplies theatrical candidates and Watchmode checks India availability. Release verification and full OTT premiere matching remain gaps for later implementation.
