# OTT Radar

India-focused cinema and streaming release discovery. This repository contains the React, Vite and TypeScript frontend for `ott.therama.dev`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The dashboard currently uses sample release cards when the `/ott/releases` endpoint is unavailable or has no rows. The sample cards are UI placeholders, not real release announcements. The browser calls only public `/ott/releases`; ingestion and provider credentials stay in the backend repository and server environment.

## Backend

The database migrations live only in the `api.therama.dev` repository. They define the India country row, candidate platform registry, nine core tables, and a verified India-only public release view. Platform seeds start `UNVERIFIED` and hidden from public results until availability is reviewed.

Huginn remains the collection/orchestration system. The initial schema keeps raw collected items and ingestion history; the authoritative normalizer and ingestion API will be added in the backend implementation phases.
