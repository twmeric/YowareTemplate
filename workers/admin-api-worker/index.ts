/**
 * Admin API Worker
 *
 * Provides a Cloudflare-native admin backend for editing site content.
 *
 * Endpoints:
 *   POST /api/login              - password login, returns JWT
 *   POST /api/generate-token     - generate auto-login token (requires master password)
 *   GET  /api/content            - read public/data/content.json
 *   POST /api/content            - write public/data/content.json
 *   GET  /api/media              - list uploaded media
 *   POST /api/media              - upload media to R2
 *   DELETE /api/media/:key       - delete media from R2
 *
 * Environment variables (encrypted):
 *   ADMIN_PASSWORD      - Master password for admin access
 *   ADMIN_TOKEN_SECRET  - HMAC secret for signing JWTs
 *   GITHUB_TOKEN        - GitHub personal access token with repo scope
 *   GITHUB_REPO         - e.g. "twmeric/YowareTemplate"
 */

export interface Env {
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  MEDIA_BUCKET_NAME: string;
  MEDIA_PUBLIC_URL: string;
  MEDIA_BUCKET: R2Bucket;
}

interface JWTPayload {
  sub: "admin";
  site: string;
  iat: number;
  exp: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

async function signJWT(payload: Omit<JWTPayload, "iat">, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now };

  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(fullPayload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return `${signingInput}.${sigB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(signingInput));
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64)) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

async function fetchGitHubFile(repo: string, path: string, token: string): Promise<{ content: string; sha?: string }> {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "JKD-Admin-API",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { content: string; sha?: string; encoding: string };
  return {
    content: base64ToUtf8(data.content.replace(/\n/g, "")),
    sha: data.sha,
  };
}

async function commitGitHubFile(
  repo: string,
  path: string,
  content: string,
  message: string,
  token: string,
  existingSha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: utf8ToBase64(content),
  };
  if (existingSha) body.sha = existingSha;

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "JKD-Admin-API",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub commit error (${res.status}): ${text}`);
  }
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function getSiteFromRequest(request: Request): string {
  const url = new URL(request.url);
  return url.hostname;
}

async function authenticate(request: Request, env: Env): Promise<JWTPayload | null> {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verifyJWT(token, env.ADMIN_TOKEN_SECRET);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const site = getSiteFromRequest(request);

    try {
      // Public health check
      if (url.pathname === "/") {
        return jsonResponse({ ok: true, service: "JKD Admin API" });
      }

      // Password login
      if (url.pathname === "/api/login" && request.method === "POST") {
        const { password } = (await request.json()) as { password?: string };
        if (!password || password !== env.ADMIN_PASSWORD) {
          return errorResponse("Invalid password", 401);
        }

        const token = await signJWT(
          { sub: "admin", site, exp: Math.floor(Date.now() / 1000) + 86400 },
          env.ADMIN_TOKEN_SECRET
        );
        return jsonResponse({ success: true, token });
      }

      // Generate auto-login token (protected by master password)
      if (url.pathname === "/api/generate-token" && request.method === "POST") {
        const { password, expiresInHours = 168 } = (await request.json()) as {
          password?: string;
          expiresInHours?: number;
        };
        if (!password || password !== env.ADMIN_PASSWORD) {
          return errorResponse("Invalid password", 401);
        }

        const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
        const token = await signJWT({ sub: "admin", site, exp }, env.ADMIN_TOKEN_SECRET);
        const adminUrl = `https://${site}/manage?token=${encodeURIComponent(token)}`;
        return jsonResponse({ success: true, token, url: adminUrl, expiresAt: new Date(exp * 1000).toISOString() });
      }

      // All other endpoints require authentication
      const authPayload = await authenticate(request, env);
      if (!authPayload) {
        return errorResponse("Unauthorized", 401);
      }

      if (url.pathname === "/api/content" && request.method === "GET") {
        const file = await fetchGitHubFile(env.GITHUB_REPO, "public/data/content.json", env.GITHUB_TOKEN);
        return jsonResponse({ success: true, content: JSON.parse(file.content) });
      }

      if (url.pathname === "/api/content" && request.method === "POST") {
        const { content } = (await request.json()) as { content?: unknown };
        if (!content) return errorResponse("Missing content");

        let existingSha: string | undefined;
        try {
          const existing = await fetchGitHubFile(env.GITHUB_REPO, "public/data/content.json", env.GITHUB_TOKEN);
          existingSha = existing.sha;
        } catch {
          existingSha = undefined;
        }

        await commitGitHubFile(
          env.GITHUB_REPO,
          "public/data/content.json",
          JSON.stringify(content, null, 2),
          "chore: update content via admin UI",
          env.GITHUB_TOKEN,
          existingSha
        );
        return jsonResponse({ success: true, message: "Content saved" });
      }

      // Media library endpoints
      if (url.pathname === "/api/media" && request.method === "GET") {
        const listed = await env.MEDIA_BUCKET.list({ limit: 1000 });
        const objects = (listed.objects || []).map((obj) => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          url: `${env.MEDIA_PUBLIC_URL}/${obj.key}`,
        }));
        return jsonResponse({ success: true, objects });
      }

      if (url.pathname === "/api/media" && request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
          return errorResponse("Missing file");
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          return errorResponse("Invalid file type. Only images are allowed.");
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          return errorResponse("File too large. Max 10MB.");
        }

        const ext = file.type.split("/").pop() || "jpg";
        const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        await env.MEDIA_BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        return jsonResponse({
          success: true,
          key,
          url: `${env.MEDIA_PUBLIC_URL}/${key}`,
        });
      }

      if (url.pathname.startsWith("/api/media/") && request.method === "DELETE") {
        const key = url.pathname.slice("/api/media/".length);
        if (!key) return errorResponse("Missing key");
        await env.MEDIA_BUCKET.delete(key);
        return jsonResponse({ success: true, message: "Deleted" });
      }

      return errorResponse("Not found", 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("Admin API error:", message);
      return errorResponse(message, 500);
    }
  },
};
