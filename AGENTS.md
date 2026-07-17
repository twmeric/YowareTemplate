# AGENTS.md — YowareTemplate

Project-specific conventions for AI agents working on YowareTemplate.

## Stack

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + React Router
- Backend: Cloudflare Workers (Platform API, Admin API, AI Content)
- Database: Cloudflare D1
- Storage: Cloudflare R2 (media)
- Hosting: Cloudflare Pages
- Package manager: pnpm

## API Response Format

All API responses must be **UTF-8 JSON**.

```ts
// Correct
new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json; charset=utf-8" },
});
```

- Always include `charset=utf-8` in the `Content-Type` header.
- Do not return plain text, HTML, or other formats for API endpoints.
- This applies to all Workers: `platform-api-worker`, `admin-api-worker`, `ai-content-worker`.

## CORS Policy

Public APIs should allow cross-origin requests from:

- Production: `https://yowaretemplate.pages.dev`
- Preview branches: `https://*.yowaretemplate.pages.dev`
- Local dev: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://[::1]:5173`

For unknown origins on public read-only endpoints, fall back to `Access-Control-Allow-Origin: *`.

## Environment Variables

Frontend env vars must start with `VITE_` to be available at build time.

- `VITE_PLATFORM_API_URL`
- `VITE_AI_API_URL`
- `VITE_ADMIN_API_URL`

## Encoding

- Source files: UTF-8 without BOM.
- HTTP responses: UTF-8 with explicit `charset=utf-8`.
- Database text: UTF-8 (D1 default).
