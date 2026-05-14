# R2 Upload API

## Endpoint

`POST /api/admin/upload`

The request must be `multipart/form-data`.

Fields:

- `file`: image or audio file
- `type`: `image` or `audio`

Authentication:

- Send the administrator password in the `x-admin-password` header.
- The server compares it with the `ADMIN_PASSWORD` environment variable.
- Do not put `ADMIN_PASSWORD` in client source code.

## Storage Paths

- `type=image` uploads to `portfolio/images/`
- `type=audio` uploads to `portfolio/audio/`

Object names are generated with `crypto.randomUUID()` and safe extensions.
Original filenames are not used.

## Required Cloudflare Bindings

R2 bucket binding:

- `PORTFOLIO_BUCKET`

Environment variables:

- `R2_PUBLIC_URL`, for example `https://static.osum.kr`
- `ADMIN_PASSWORD`

## Wrangler Example

See `wrangler.toml`.

```toml
[[r2_buckets]]
binding = "PORTFOLIO_BUCKET"
bucket_name = "osum-portfolio"

[vars]
R2_PUBLIC_URL = "https://static.osum.kr"
```

Set `ADMIN_PASSWORD` as a secret in Cloudflare Pages, not in `wrangler.toml`.

## Local Test

Build the static assets:

```bash
npm.cmd run build
```

Run Pages Functions locally with an R2 binding:

```bash
npx wrangler pages dev dist --r2=PORTFOLIO_BUCKET --var R2_PUBLIC_URL:https://static.osum.kr --var ADMIN_PASSWORD:your-local-password
```

Then open `/admin` and use the image/audio upload test forms.
