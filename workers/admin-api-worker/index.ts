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
 *   DEMO_PASSWORD       - Read-only demo password for prospects
 *   ADMIN_TOKEN_SECRET  - HMAC secret for signing JWTs
 *   GITHUB_TOKEN        - GitHub personal access token with repo scope
 *   GITHUB_REPO         - e.g. "twmeric/YowareTemplate"
 */

export interface Env {
  ADMIN_PASSWORD: string;
  DEMO_PASSWORD: string;
  ADMIN_TOKEN_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  MEDIA_BUCKET_NAME: string;
  MEDIA_PUBLIC_URL: string;
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
}

type AdminRole = "admin" | "demo";

interface JWTPayload {
  sub: "admin";
  role: AdminRole;
  site: string;
  iat: number;
  exp: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

function orderErrorResponse(code: string, message: string, status = 400): Response {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

function requireAdmin(authPayload: JWTPayload): Response | null {
  if (authPayload.role === "demo") {
    return errorResponse("Demo accounts are read-only", 403);
  }
  return null;
}

const VALID_ORDER_STATUSES = ["pending", "reviewing", "accepted", "rejected", "completed", "cancelled"] as const;

type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

function safeParseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapOrderRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    publicId: row.public_id,
    status: row.status,
    customer: {
      id: row.c_id,
      name: row.c_name,
      email: row.c_email,
      phone: row.c_phone,
      whatsapp: row.c_whatsapp,
      preferredContact: row.c_preferred_contact,
    },
    template: row.t_id
      ? {
          id: row.t_id,
          slug: row.t_slug,
          name: row.t_name,
        }
      : null,
    briefAnswers: safeParseJson<Record<string, unknown>>(row.brief_answers),
    ownerNotes: row.owner_notes,
    quotedAmount: row.quoted_amount,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function handleListOrders(url: URL, env: Env): Promise<Response> {
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;

  if (status && !(VALID_ORDER_STATUSES as readonly string[]).includes(status)) {
    return orderErrorResponse("VALIDATION_ERROR", "Invalid status filter", 400);
  }

  let whereClause = "";
  const params: (string | number)[] = [];
  if (status) {
    whereClause = "WHERE o.status = ?";
    params.push(status);
  }

  const orderSql = `
    SELECT o.id, o.public_id, o.status, o.brief_answers, o.owner_notes, o.quoted_amount, o.currency, o.created_at, o.updated_at,
           c.id as c_id, c.email as c_email, c.name as c_name, c.phone as c_phone, c.whatsapp as c_whatsapp, c.preferred_contact as c_preferred_contact,
           t.id as t_id, t.slug as t_slug, t.name as t_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN templates t ON o.template_id = t.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const { results } = await env.DB.prepare(orderSql).bind(...params, limit, offset).all();

  const countSql = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
  const countRow = await env.DB.prepare(countSql).bind(...params).first();
  const total = (countRow?.total as number) || 0;

  const orders = (results || []).map((row) => mapOrderRow(row as Record<string, unknown>));
  return jsonResponse({ success: true, data: { orders, total } });
}

async function handleGetOrder(id: number, env: Env): Promise<Response> {
  const row = await env.DB.prepare(`
    SELECT o.id, o.public_id, o.status, o.brief_answers, o.owner_notes, o.quoted_amount, o.currency, o.created_at, o.updated_at,
           c.id as c_id, c.email as c_email, c.name as c_name, c.phone as c_phone, c.whatsapp as c_whatsapp, c.preferred_contact as c_preferred_contact,
           t.id as t_id, t.slug as t_slug, t.name as t_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN templates t ON o.template_id = t.id
    WHERE o.id = ?
  `).bind(id).first();

  if (!row) {
    return orderErrorResponse("NOT_FOUND", "Order not found", 404);
  }

  const eventsResult = await env.DB.prepare(`
    SELECT id, event, actor, payload, created_at
    FROM order_events
    WHERE order_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();

  const order = {
    ...mapOrderRow(row as Record<string, unknown>),
    events: (eventsResult.results || []).map((e) => ({
      id: (e as Record<string, unknown>).id,
      event: (e as Record<string, unknown>).event,
      actor: (e as Record<string, unknown>).actor,
      payload: safeParseJson((e as Record<string, unknown>).payload),
      createdAt: (e as Record<string, unknown>).created_at,
    })),
  };

  return jsonResponse({ success: true, data: { order } });
}

async function handlePatchOrder(request: Request, id: number, env: Env): Promise<Response> {
  let body: { status?: string; ownerNotes?: string };
  try {
    body = (await request.json()) as { status?: string; ownerNotes?: string };
  } catch {
    return orderErrorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const hasStatus = body.status !== undefined;
  const hasNotes = body.ownerNotes !== undefined;

  if (!hasStatus && !hasNotes) {
    return orderErrorResponse("VALIDATION_ERROR", "At least one of status or ownerNotes is required", 400);
  }

  if (hasStatus && !(VALID_ORDER_STATUSES as readonly string[]).includes(body.status)) {
    return orderErrorResponse("VALIDATION_ERROR", `Invalid status. Allowed: ${VALID_ORDER_STATUSES.join(", ")}`, 400);
  }

  const current = await env.DB.prepare(`SELECT status, owner_notes, public_id FROM orders WHERE id = ?`).bind(id).first();
  if (!current) {
    return orderErrorResponse("NOT_FOUND", "Order not found", 404);
  }

  const statements: D1PreparedStatement[] = [];
  const now = new Date().toISOString();

  if (hasStatus && body.status !== current.status) {
    const payload = JSON.stringify({ from: current.status, to: body.status });
    statements.push(
      env.DB.prepare(`INSERT INTO order_events (order_id, event, actor, payload, created_at) VALUES (?, ?, ?, ?, ?)`).bind(
        id,
        "status_changed",
        "owner",
        payload,
        now
      )
    );
  }

  if (hasNotes && body.ownerNotes !== current.owner_notes) {
    const payload = JSON.stringify({ notes: body.ownerNotes });
    statements.push(
      env.DB.prepare(`INSERT INTO order_events (order_id, event, actor, payload, created_at) VALUES (?, ?, ?, ?, ?)`).bind(
        id,
        "note_added",
        "owner",
        payload,
        now
      )
    );
  }

  statements.push(
    env.DB.prepare(`UPDATE orders SET status = COALESCE(?, status), owner_notes = COALESCE(?, owner_notes), updated_at = ? WHERE id = ?`).bind(
      hasStatus ? body.status : null,
      hasNotes ? body.ownerNotes : null,
      now,
      id
    )
  );

  await env.DB.batch(statements);

  return jsonResponse({
    success: true,
    data: {
      id,
      publicId: current.public_id,
      status: hasStatus ? body.status : current.status,
      ownerNotes: hasNotes ? body.ownerNotes : current.owner_notes,
      updatedAt: now,
    },
  });
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

      // Password login (admin or read-only demo)
      if (url.pathname === "/api/login" && request.method === "POST") {
        const { password } = (await request.json()) as { password?: string };
        let role: AdminRole | null = null;
        const trimmedPassword = password?.trim();
        if (trimmedPassword && trimmedPassword === env.ADMIN_PASSWORD?.trim()) {
          role = "admin";
        } else if (trimmedPassword && env.DEMO_PASSWORD && trimmedPassword === env.DEMO_PASSWORD.trim()) {
          role = "demo";
        }

        if (!role) {
          return errorResponse("Invalid password", 401);
        }

        const token = await signJWT(
          { sub: "admin", role, site, exp: Math.floor(Date.now() / 1000) + 86400 },
          env.ADMIN_TOKEN_SECRET
        );
        return jsonResponse({ success: true, token, role });
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
        const token = await signJWT({ sub: "admin", role: "admin", site, exp }, env.ADMIN_TOKEN_SECRET);
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
        const forbidden = requireAdmin(authPayload);
        if (forbidden) return forbidden;

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
        const forbidden = requireAdmin(authPayload);
        if (forbidden) return forbidden;

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
        const forbidden = requireAdmin(authPayload);
        if (forbidden) return forbidden;

        const key = url.pathname.slice("/api/media/".length);
        if (!key) return errorResponse("Missing key");
        await env.MEDIA_BUCKET.delete(key);
        return jsonResponse({ success: true, message: "Deleted" });
      }

      // Order management endpoints
      if (url.pathname === "/api/orders" && request.method === "GET") {
        return handleListOrders(url, env);
      }

      const orderMatch = url.pathname.match(/^\/api\/orders\/(\d+)$/);
      if (orderMatch) {
        const id = parseInt(orderMatch[1], 10);
        if (request.method === "GET") {
          return handleGetOrder(id, env);
        }
        if (request.method === "PATCH") {
          const forbidden = requireAdmin(authPayload);
          if (forbidden) return forbidden;
          return handlePatchOrder(request, id, env);
        }
      }

      return errorResponse("Not found", 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("Admin API error:", message);
      return errorResponse(message, 500);
    }
  },
};
