import type { SiteContent } from "../types/content";

const ADMIN_API_URL = "https://jkd-admin-api-worker.jimsbond007.workers.dev";

export class AdminAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
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

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new AdminAPIError(res.status, data.error || `HTTP ${res.status}`);
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
