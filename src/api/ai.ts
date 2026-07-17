const AI_API_URL =
  import.meta.env.VITE_AI_API_URL ||
  "https://jkd-ai-content-worker.jimsbond007.workers.dev";

export interface GenerateContentPayload {
  brief: string;
}

export interface GenerateContentResult {
  content: Record<string, unknown>;
}

export class AIAPIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export async function generateContent(
  brief: string
): Promise<GenerateContentResult> {
  const url = `${AI_API_URL}/api/generate`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
  } catch (networkErr) {
    // eslint-disable-next-line no-console
    console.error("[AIAPI] Network error fetching", url, networkErr);
    throw new AIAPIError(
      0,
      "NETWORK_ERROR",
      networkErr instanceof Error ? networkErr.message : "無法連線到 AI 伺服器"
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: GenerateContentResult;
    error?: { code: string; message: string } | string;
  };

  if (!res.ok || body.success === false) {
    let message = "生成失敗";
    if (typeof body.error === "string") {
      message = body.error;
    } else if (body.error && typeof body.error === "object" && "message" in body.error) {
      message = body.error.message;
    }
    throw new AIAPIError(res.status, "GENERATION_ERROR", message);
  }

  if (!body.data?.content) {
    throw new AIAPIError(res.status, "INVALID_RESPONSE", "回應缺少生成的內容");
  }

  return body.data;
}

export default { generateContent };
