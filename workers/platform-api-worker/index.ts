/**
 * Platform API Worker
 *
 * Public API for the YowareTemplate SaaS platform.
 *
 * Endpoints:
 *   GET  /                         - health check
 *   GET  /api/templates            - list active templates
 *   GET  /api/templates/:slug      - single template with wizard schema
 *   POST /api/orders               - create order
 *   GET  /api/orders/:publicId/status - public order status lookup
 */

import { z } from "zod";

export interface Env {
  DB: D1Database;
  CLOUDWAPI_API_KEY: string;
  CLOUDWAPI_SENDER: string;
  CLOUDWAPI_RECEIVER: string;
  PLATFORM_ORIGIN: string;
  RATE_LIMIT_PER_HOUR: string;
  ADMIN_TOKEN_SECRET: string;
}

const ALLOWED_ORIGINS = [
  "https://yowaretemplate.pages.dev",
  "http://localhost:5173",
  "http://localhost:8787",
];

const CUSTOMER_SCHEMA = z.object({
  name: z.string().min(1, "Customer name is required").max(200),
  email: z.string().email("Invalid customer email").max(200),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
});

const ORDER_SCHEMA = z.object({
  templateSlug: z.string().min(1, "Template slug is required").max(100),
  customer: CUSTOMER_SCHEMA,
  answers: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
  honeypot: z.string().optional(),
});

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, origin: string | null): Record<string, string> {
  const allowedOrigin = origin ?? ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonResponse(data: unknown, request: Request, status = 200): Response {
  const origin = getAllowedOrigin(request);
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, origin) },
  });
}

function errorResponse(
  code: string,
  message: string,
  request: Request,
  status = 400
): Response {
  return jsonResponse({ success: false, error: { code, message } }, request, status);
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function generatePublicId(now = new Date()): string {
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  for (let i = 0; i < 4; i++) {
    random += chars[array[i] % chars.length];
  }
  return `YWT-${yyyymmdd}-${random}`;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string, limitPerHour: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= limitPerHour) {
    return false;
  }
  entry.count += 1;
  return true;
}

async function getTemplateBySlug(db: D1Database, slug: string): Promise<unknown | null> {
  const result = await db
    .prepare("SELECT * FROM templates WHERE slug = ? AND is_active = 1")
    .bind(slug)
    .first();
  return result ?? null;
}

async function getOrCreateCustomer(
  db: D1Database,
  customer: z.infer<typeof CUSTOMER_SCHEMA>
): Promise<number> {
  const existing = await db
    .prepare("SELECT id FROM customers WHERE email = ?")
    .bind(customer.email)
    .first<{ id: number }>();

  if (existing) {
    await db
      .prepare(
        "UPDATE customers SET name = ?, phone = ?, whatsapp = ?, preferred_contact = ? WHERE id = ?"
      )
      .bind(
        customer.name,
        customer.phone ?? null,
        customer.whatsapp ?? null,
        customer.preferredContact ?? "email",
        existing.id
      )
      .run();
    return existing.id;
  }

  const result = await db
    .prepare(
      "INSERT INTO customers (email, name, phone, whatsapp, preferred_contact) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      customer.email,
      customer.name,
      customer.phone ?? null,
      customer.whatsapp ?? null,
      customer.preferredContact ?? "email"
    )
    .run();

  return result.meta.last_row_id as number;
}

async function sendWhatsAppNotification(
  env: Env,
  order: {
    publicId: string;
    customerName: string;
    customerEmail: string;
    customerWhatsapp?: string;
    templateName: string;
    brandName: string;
    briefSummary: string;
  }
): Promise<boolean> {
  if (!env.CLOUDWAPI_API_KEY || !env.CLOUDWAPI_SENDER) {
    console.warn("WhatsApp notification skipped: missing CloudWapi configuration");
    return false;
  }

  // 若未單獨設定接收號碼，則預設發給 sender 自己
  const receiver = env.CLOUDWAPI_RECEIVER || env.CLOUDWAPI_SENDER;
  const sender = env.CLOUDWAPI_SENDER.replace(/\D/g, "");
  const number = receiver.replace(/\D/g, "");

  const message =
    `【YowareTemplate 新訂單】\n` +
    `訂單編號：${order.publicId}\n` +
    `模板：${order.templateName}\n` +
    `客戶姓名：${order.customerName}\n` +
    `客戶 Email：${order.customerEmail}\n` +
    `客戶 WhatsApp：${order.customerWhatsapp || "未提供"}\n` +
    `品牌名稱：${order.brandName || "未提供"}\n` +
    `需求摘要：${order.briefSummary}\n` +
    `後台連結：https://yowaretemplate.pages.dev/manage/orders`;

  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://unofficial.cloudwapi.in/send-message?` +
      `api_key=${encodeURIComponent(env.CLOUDWAPI_API_KEY)}&` +
      `sender=${encodeURIComponent(sender)}&` +
      `number=${encodeURIComponent(number)}&` +
      `message=${encodedMessage}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const result = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (result.status === true || result.status === "success") {
      return true;
    }

    console.error("CloudWapi error:", result.msg || JSON.stringify(result));
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("WhatsApp notification fetch error:", message);
    return false;
  }
}

function templateListRow(row: Record<string, unknown>) {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    basePrice: row.base_price,
    currency: row.currency,
    isFeatured: row.is_featured === 1,
  };
}

function templateDetailRow(row: Record<string, unknown>) {
  let wizardSchema: unknown = [];
  try {
    wizardSchema = JSON.parse(row.wizard_schema as string);
  } catch {
    wizardSchema = [];
  }

  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    previewUrl: row.preview_url,
    basePrice: row.base_price,
    currency: row.currency,
    wizardSchema,
    isActive: row.is_active === 1,
    isFeatured: row.is_featured === 1,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      const origin = getAllowedOrigin(request);
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, origin),
      });
    }

    try {
      if (url.pathname === "/" && request.method === "GET") {
        return jsonResponse(
          { success: true, data: { name: "jkd-platform-api-worker", version: "1.0.0" } },
          request
        );
      }

      if (url.pathname === "/api/templates" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM templates WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
        ).all<Record<string, unknown>>();
        return jsonResponse(
          { success: true, data: (results ?? []).map(templateListRow) },
          request
        );
      }

      if (url.pathname.startsWith("/api/templates/") && request.method === "GET") {
        const slug = url.pathname.slice("/api/templates/".length);
        const row = await getTemplateBySlug(env.DB, slug);
        if (!row) {
          return errorResponse("NOT_FOUND", "Template not found", request, 404);
        }
        return jsonResponse({ success: true, data: templateDetailRow(row as Record<string, unknown>) }, request);
      }

      if (url.pathname === "/api/orders" && request.method === "POST") {
        const clientIp = getClientIp(request);
        const rateLimit = parseInt(env.RATE_LIMIT_PER_HOUR || "5", 10) || 5;
        if (!checkRateLimit(clientIp, rateLimit)) {
          return errorResponse(
            "RATE_LIMITED",
            `Too many requests. Please try again later.`,
            request,
            429
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("VALIDATION_ERROR", "Invalid JSON body", request, 400);
        }

        const parseResult = ORDER_SCHEMA.safeParse(body);
        if (!parseResult.success) {
          const messages = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
          return errorResponse("VALIDATION_ERROR", messages, request, 400);
        }

        const data = parseResult.data;

        // Honeypot: silently accept without creating order
        if (data.honeypot && data.honeypot.length > 0) {
          return jsonResponse({ success: true, data: { accepted: true } }, request);
        }

        const template = await getTemplateBySlug(env.DB, data.templateSlug);
        if (!template) {
          return errorResponse("VALIDATION_ERROR", "Template not found", request, 400);
        }

        const now = new Date();
        const publicId = generatePublicId(now);
        const briefAnswers = JSON.stringify({
          ...data.answers,
          _metadata: data.metadata ?? {},
        });

        const customerId = await getOrCreateCustomer(env.DB, data.customer);

        const orderResult = await env.DB.prepare(
          `INSERT INTO orders
            (public_id, customer_id, template_id, brief_answers, source_ip, user_agent, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            publicId,
            customerId,
            (template as Record<string, unknown>).id as number,
            briefAnswers,
            clientIp,
            request.headers.get("User-Agent") ?? null,
            formatDate(now),
            formatDate(now)
          )
          .run();

        const orderId = orderResult.meta.last_row_id as number;

        await env.DB.prepare(
          "INSERT INTO order_events (order_id, event, actor, payload, created_at) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(orderId, "submitted", "system", JSON.stringify({ sourceIp: clientIp }), formatDate(now))
          .run();

        // Send notification asynchronously; do not fail the request
        const answers = data.answers as Record<string, unknown>;
        const brandName = String(answers.brandName || "");
        const sellingPoints = String(answers.sellingPoints || "");
        const briefSummary = sellingPoints.slice(0, 200);

        const notified = await sendWhatsAppNotification(env, {
          publicId,
          id: orderId,
          customerName: data.customer.name,
          customerEmail: data.customer.email,
          customerWhatsapp: data.customer.whatsapp,
          templateName: String((template as Record<string, unknown>).name),
          brandName,
          briefSummary,
        });

        if (notified) {
          const notifiedAt = formatDate(new Date());
          await env.DB.prepare("UPDATE orders SET notification_sent_at = ? WHERE id = ?")
            .bind(notifiedAt, orderId)
            .run();
          await env.DB.prepare(
            "INSERT INTO order_events (order_id, event, actor, payload, created_at) VALUES (?, ?, ?, ?, ?)"
          )
            .bind(orderId, "notified", "system", JSON.stringify({ channel: "whatsapp" }), notifiedAt)
            .run();
        }

        return jsonResponse(
          {
            success: true,
            data: {
              orderId,
              publicId,
              status: "pending",
              createdAt: formatDate(now),
            },
          },
          request,
          201
        );
      }

      if (url.pathname.startsWith("/api/orders/") && url.pathname.endsWith("/status") && request.method === "GET") {
        const publicId = url.pathname.slice("/api/orders/".length, -"/status".length);
        const row = await env.DB.prepare(
          "SELECT public_id, status, created_at FROM orders WHERE public_id = ?"
        )
          .bind(publicId)
          .first<{ public_id: string; status: string; created_at: string }>();

        if (!row) {
          return errorResponse("NOT_FOUND", "Order not found", request, 404);
        }

        return jsonResponse(
          {
            success: true,
            data: {
              publicId: row.public_id,
              status: row.status,
              createdAt: row.created_at,
            },
          },
          request
        );
      }

      return errorResponse("NOT_FOUND", "Not found", request, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("Platform API error:", message);
      return errorResponse("INTERNAL_ERROR", message, request, 500);
    }
  },
};
