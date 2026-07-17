# cf-spa-kv-cms

A reusable single-page website template powered by React 18, TypeScript, Vite 7, Tailwind CSS 3.4, Cloudflare Pages Functions (Hono) and Cloudflare KV. Content is JSON-driven and editable through a hidden `/admin` CMS backend.

## Stack

- **Frontend**: React 18 + TypeScript + Vite 7 + Tailwind CSS 3.4
- **Content**: `src/content/*.json` (loaded by `src/lib/contentLoader.ts` and `src/lib/content.tsx`)
- **CMS backend**: Cloudflare Pages Functions (Hono) with JWT auth
- **Runtime storage**: Cloudflare KV (`CMS_KV` binding)
- **Deployment**: Cloudflare Pages
- **Package manager**: pnpm

## Install

```bash
pnpm install
```

> This repository has `.npmrc` set to `ignore-workspace=true` so it can live inside a monorepo without conflicts.

## Local dev

```bash
pnpm dev
```

Vite dev server runs at `http://127.0.0.1:5173`.

## Cloudflare setup

1. Create a Cloudflare Pages project (e.g. `your-project`).
2. Create a KV namespace from the Cloudflare dashboard or with Wrangler:
   ```bash
   pnpm dlx wrangler kv namespace create "CMS_KV"
   ```
3. Copy the returned namespace ID and paste it into `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "CMS_KV"
   id = "YOUR_KV_NAMESPACE_ID"
   ```

## Secrets

Set the two required secrets for the CMS:

```bash
pnpm dlx wrangler pages secret put ADMIN_PASSWORD
pnpm dlx wrangler pages secret put JWT_SECRET
```

- `ADMIN_PASSWORD`: password used to log in to `/admin`
- `JWT_SECRET`: a long random string used to sign JWT tokens

Optional secret:

```bash
pnpm dlx wrangler pages secret put ADMIN_USER
```

If not set, the default username is `admin`.

## Update content

All copy, image paths, contact info and navigation live in `src/content/*.json`. Edit those files and rebuild to publish changes.

| File | Content |
|------|---------|
| `site.json` | Site name, phone, address, WhatsApp number, registration number, social links |
| `navigation.json` | Navigation links and CTA |
| `hero.json` | Hero headline, CTAs, trust badges, background image |
| `about.json` | About section timeline and philosophy cards |
| `services.json` | Service items and process steps |
| `gallery.json` | Gallery image grid |
| `faq.json` | FAQ items |
| `health-blog.json` | Blog / coming-soon section |
| `contact.json` | Contact info, opening hours, map embed URL |
| `footer.json` | Footer slogan, links, disclaimer |
| `tcm-intro.json` | Intro / article section |

Put images in `public/assets/images/` and reference them as `/assets/images/your-file.jpg`.

## Build

```bash
pnpm build
```

This runs `tsc --noEmit` followed by `vite build`. Type errors must be fixed before the build succeeds.

## Deploy

```bash
pnpm deploy
```

Or deploy manually:

```bash
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=your-project
```

## Access the CMS

After deploying, go to `https://your-project.pages.dev/admin` and log in with the username and `ADMIN_PASSWORD` you configured.

## Notes

- `/admin` is intentionally not linked from the public navigation.
- The site falls back to the bundled JSON content if KV is empty or unavailable.
- Do not commit `.env`, `.dev.vars`, Cloudflare API tokens or KV IDs to version control.
