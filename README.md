# Lesson Studio Site

OSUM music academy / lesson studio portfolio site. The public site is a Vite static frontend, and Cloudflare Pages Functions provide the admin APIs for R2 media uploads and D1-backed portfolio data.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the Vite development server:

```bash
npm run dev
```

Build the site:

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## Cloudflare Pages Deployment

Recommended Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`

Deploy with Wrangler if preferred:

```bash
npm run build
npx wrangler pages deploy dist
```

## Required Environment Variables

Set these in Cloudflare Pages project settings. Do not commit real values.

- `R2_PUBLIC_URL`: public base URL for R2 assets, for example `https://static.osum.kr`
- `ADMIN_PASSWORD`: password required by `/admin` and `/api/admin/*`

## Required Cloudflare Bindings

Pages Functions require:

- R2 bucket binding: `PORTFOLIO_BUCKET`
- D1 database binding: `DB`

`wrangler.toml` contains example binding names. Replace the D1 `database_id` placeholder with your real Cloudflare D1 database id locally or in deployment settings.

## R2 Setup

Create an R2 bucket:

```bash
npx wrangler r2 bucket create osum-portfolio
```

In Cloudflare Pages:

1. Open the Pages project.
2. Go to Settings -> Functions.
3. Add R2 bucket binding:
   - Variable name: `PORTFOLIO_BUCKET`
   - Bucket: `osum-portfolio`

Uploaded image files are stored under `portfolio/images/`.
Uploaded audio files are stored under `portfolio/audio/`.

## D1 Setup

Create a D1 database:

```bash
npx wrangler d1 create osum-portfolio-db
```

Apply migrations:

```bash
npx wrangler d1 migrations apply osum-portfolio-db
```

For local development:

```bash
npx wrangler d1 migrations apply osum-portfolio-db --local
```

In Cloudflare Pages:

1. Open the Pages project.
2. Go to Settings -> Functions.
3. Add D1 database binding:
   - Variable name: `DB`
   - Database: `osum-portfolio-db`

## Local Cloudflare Functions Test

After building:

```bash
npm run build
npx wrangler pages dev dist --r2=PORTFOLIO_BUCKET --d1=DB --var R2_PUBLIC_URL:https://static.osum.kr --var ADMIN_PASSWORD:local-password
```

Open `/admin`, enter the local admin password, upload media, and save portfolio items.

## Admin Features

The `/admin` page lets an administrator:

- upload image files to R2
- upload audio files to R2
- create portfolio items in D1
- list all portfolio items, including hidden ones
- toggle visible/hidden state
- edit portfolio metadata
- delete portfolio rows from D1

The public portfolio modal calls `GET /api/portfolio`, which returns only visible items from D1.

## API Summary

- `POST /api/admin/upload`: upload image/audio to R2
- `GET /api/portfolio`: public visible portfolio list
- `GET /api/admin/portfolio`: admin portfolio list
- `POST /api/admin/portfolio`: create portfolio item
- `PATCH /api/admin/portfolio/:id`: update portfolio item
- `DELETE /api/admin/portfolio/:id`: delete portfolio item

Admin APIs require the `x-admin-password` header or `Authorization: Bearer <password>`.

## Security Notes

- Do not commit `.env`, `.dev.vars`, API keys, R2 keys, Cloudflare tokens, or real admin passwords.
- `ADMIN_PASSWORD`, R2 credentials, D1 details, and Cloudflare tokens must stay in Cloudflare settings or local ignored files.
- Browser code never receives R2 secrets or D1 credentials.
