import { AdminAPIError } from "./admin";

const ADMIN_API_URL = "https://jkd-admin-api-worker.jimsbond007.workers.dev";

export interface MediaObject {
  key: string;
  size: number;
  uploaded: string;
  url: string;
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = localStorage.getItem("jkd_admin_token");
  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...options,
    headers: {
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

export async function listMedia(): Promise<MediaObject[]> {
  const data = (await request("/api/media")) as { objects: MediaObject[] };
  return data.objects;
}

export async function uploadMedia(file: File): Promise<MediaObject> {
  const formData = new FormData();
  formData.append("file", file);

  const data = (await request("/api/media", {
    method: "POST",
    body: formData,
  })) as MediaObject;
  return data;
}

export async function deleteMedia(key: string): Promise<void> {
  await request(`/api/media/${encodeURIComponent(key)}`, { method: "DELETE" });
}
