/// <reference types="vite/client" />
import type { SiteContent } from "../types/content";

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "https://jkd-admin-api-worker.jimsbond007.workers.dev";

export class AdminAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface Customer {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  preferredContact: string | null;
}

export interface TemplateRef {
  id: number;
  slug: string;
  name: string;
}

export interface OrderEvent {
  id: number;
  event: string;
  actor: string | null;
  payload: unknown;
  createdAt: string;
}

export interface Order {
  id: number;
  publicId: string;
  status: string;
  customer: Customer;
  template: TemplateRef | null;
  briefAnswers: Record<string, unknown>;
  ownerNotes: string | null;
  quotedAmount: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  events?: OrderEvent[];
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = localStorage.getItem("jkd_admin_token");
  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string | { code: string; message: string };
  };
  if (!res.ok) {
    let message: string;
    if (typeof data.error === "string") {
      message = data.error;
    } else if (data.error && typeof data.error === "object" && "message" in data.error) {
      message = data.error.message;
    } else {
      message = `HTTP ${res.status}`;
    }
    throw new AdminAPIError(res.status, message);
  }
  return data;
}

export async function login(password: string): Promise<string> {
  const data = (await request("/api/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  })) as { token: string };
  localStorage.setItem("jkd_admin_token", data.token);
  return data.token;
}

export function logout(): void {
  localStorage.removeItem("jkd_admin_token");
}

export function setToken(token: string): void {
  localStorage.setItem("jkd_admin_token", token);
}

export async function loadContent(): Promise<SiteContent> {
  const data = (await request("/api/content")) as { content: SiteContent };
  return data.content;
}

export async function saveContent(content: SiteContent): Promise<void> {
  await request("/api/content", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const data = (await request(`/api/orders${qs ? `?${qs}` : ""}`)) as {
    orders: Order[];
    total: number;
  };
  return { orders: data.orders, total: data.total };
}

export async function getOrder(id: number): Promise<Order> {
  const data = (await request(`/api/orders/${id}`)) as { order: Order };
  return data.order;
}

export async function updateOrder(
  id: number,
  payload: { status?: string; ownerNotes?: string }
): Promise<Order> {
  const data = (await request(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })) as Order;
  return data;
}
