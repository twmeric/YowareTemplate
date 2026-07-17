const API_URL =
  import.meta.env.VITE_PLATFORM_API_URL ||
  "https://jkd-platform-api-worker.jimsbond007.workers.dev";

export interface TemplateSummary {
  slug: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  basePrice: number;
  currency: string;
  isFeatured: boolean;
}

export interface WizardField {
  name: string;
  type: "text" | "textarea" | "select" | "email" | "tel" | "number";
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface TemplateDetail {
  slug: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  previewUrl: string;
  basePrice: number;
  currency: string;
  wizardSchema: WizardField[];
  isActive: boolean;
  isFeatured: boolean;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferredContact: "email" | "phone" | "whatsapp";
}

export interface CreateOrderPayload {
  templateSlug: string;
  customer: CustomerPayload;
  answers: Record<string, string>;
  metadata?: Record<string, string>;
  honeypot?: string;
}

export interface CreateOrderResult {
  orderId: number;
  publicId: string;
  status: string;
  createdAt: string;
}

export class PlatformAPIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: { code: string; message: string };
  };

  if (!res.ok || body.success === false) {
    const code = body.error?.code || "UNKNOWN_ERROR";
    const message = body.error?.message || `HTTP ${res.status}`;
    throw new PlatformAPIError(res.status, code, message);
  }

  if (body.data === undefined) {
    throw new PlatformAPIError(res.status, "INVALID_RESPONSE", "回應缺少資料");
  }

  return body.data;
}

export async function listTemplates(): Promise<TemplateSummary[]> {
  return request<TemplateSummary[]>("/api/templates");
}

export async function getTemplate(slug: string): Promise<TemplateDetail> {
  return request<TemplateDetail>(`/api/templates/${encodeURIComponent(slug)}`);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResult> {
  return request<CreateOrderResult>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrderStatus(
  publicId: string
): Promise<{ publicId: string; status: string; createdAt: string }> {
  return request<{ publicId: string; status: string; createdAt: string }>(
    `/api/orders/${encodeURIComponent(publicId)}/status`
  );
}

export default {
  listTemplates,
  getTemplate,
  createOrder,
  getOrderStatus,
};
