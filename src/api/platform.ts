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
  generatedContent?: Record<string, unknown>;
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
  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (networkErr) {
    // eslint-disable-next-line no-console
    console.error("[PlatformAPI] Network error fetching", url, networkErr);
    throw new PlatformAPIError(
      0,
      "NETWORK_ERROR",
      networkErr instanceof Error ? networkErr.message : "無法連線到伺服器"
    );
  }

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

export interface VerificationSession {
  code: string;
  expiresIn: number;
}

export interface VerificationStatus {
  verified: boolean;
  expired?: boolean;
  phone?: string;
  exists?: boolean;
}

export async function requestVerificationCode(): Promise<VerificationSession> {
  return request<VerificationSession>("/api/verify/request", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function checkVerificationStatus(
  code: string
): Promise<VerificationStatus> {
  return request<VerificationStatus>(
    `/api/verify/status?code=${encodeURIComponent(code)}`
  );
}

export interface AdminOrderDetail {
  id: number;
  publicId: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  briefAnswers?: Record<string, unknown>;
  generatedContent?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminOrder(
  token: string,
  publicId: string
): Promise<AdminOrderDetail> {
  const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(publicId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AdminOrderDetail;
    error?: { message?: string };
  };
  if (!res.ok || body.success === false) {
    throw new PlatformAPIError(
      res.status,
      body.error ? "ADMIN_ERROR" : "UNKNOWN_ERROR",
      body.error?.message || `HTTP ${res.status}`
    );
  }
  if (body.data === undefined) {
    throw new PlatformAPIError(res.status, "INVALID_RESPONSE", "回應缺少資料");
  }
  return body.data;
}

export default {
  listTemplates,
  getTemplate,
  createOrder,
  getOrderStatus,
  requestVerificationCode,
  checkVerificationStatus,
};
