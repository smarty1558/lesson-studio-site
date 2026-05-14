# Cloudflare D1 Portfolio Setup

## 1. Create D1 Database

```bash
npx wrangler d1 create osum-portfolio-db
```

Copy the returned `database_id` into `wrangler.toml`.

## 2. Apply Migration

```bash
npx wrangler d1 migrations apply osum-portfolio-db
```

For local development:

```bash
npx wrangler d1 migrations apply osum-portfolio-db --local
```

## 3. Cloudflare Pages D1 Binding

In Cloudflare Dashboard:

Pages project -> Settings -> Functions -> D1 database bindings

- Variable name: `DB`
- D1 database: `osum-portfolio-db`

## 4. Cloudflare Pages R2 Binding

Pages project -> Settings -> Functions -> R2 bucket bindings

- Variable name: `PORTFOLIO_BUCKET`
- R2 bucket: `osum-portfolio`

## 5. R2_PUBLIC_URL

Pages project -> Settings -> Environment variables:

- `R2_PUBLIC_URL=https://static.osum.kr`

This URL must point to a public R2 custom domain or another public R2 delivery URL.

## 6. ADMIN_PASSWORD

Pages project -> Settings -> Environment variables:

- `ADMIN_PASSWORD=<strong password>`

Do not put this value in client-side code.

## 7. Local Development

```bash
npm.cmd run build
npx wrangler pages dev dist --r2=PORTFOLIO_BUCKET --d1=DB --var R2_PUBLIC_URL:https://static.osum.kr --var ADMIN_PASSWORD:local-password
```

Open `/admin`, enter the local admin password, upload media, and save a portfolio item.

## 8. Deploy

Connect the repository to Cloudflare Pages or deploy with Wrangler after building:

```bash
npm.cmd run build
npx wrangler pages deploy dist
```

Make sure Pages Functions bindings are configured before testing uploads or D1 reads.

## 9. Add Portfolio Item

1. Open `/admin`.
2. Enter `ADMIN_PASSWORD`.
3. Fill title, description, category, date, visibility, and sort order.
4. Choose optional image and audio files.
5. Save. Files upload to R2 first, then the returned public URLs are saved in D1.

## 10. Public Data Flow

The public portfolio modal calls `GET /api/portfolio`.

The API reads visible rows from D1:

```sql
WHERE visible = 1
ORDER BY sort_order ASC, created_at DESC
```

Rows are mapped from D1 snake_case columns to frontend camelCase fields and rendered with the existing portfolio card layout.
