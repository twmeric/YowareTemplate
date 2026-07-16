/**
 * Edge AI Content Worker
 *
 * Receives GitHub webhooks when `brief.txt` changes, calls DeepSeek to generate
 * site content, fetches free images from Pixabay, validates the JSON, then
 * commits `public/data/content.json` back to the repository.
 *
 * Environment variables (all encrypted):
 *   DEEPSEEK_API_KEY    - DeepSeek API key
 *   GITHUB_TOKEN        - GitHub personal access token with repo scope
 *   PIXABAY_API_KEY     - (optional) Pixabay API key for image search
 *   GITHUB_WEBHOOK_SECRET - (optional) Webhook signature verification
 */

export interface Env {
  DEEPSEEK_API_KEY: string;
  GITHUB_TOKEN: string;
  PIXABAY_API_KEY?: string;
  GITHUB_WEBHOOK_SECRET?: string;
}

// Shape expected from DeepSeek before image replacement.
// Any string starting with "SEARCH:" will be sent to Pixabay.
interface RawSiteContent {
  brand: {
    name: string;
    logo: string;
    tagline: string;
  };
  nav: {
    items: Array<{ label: string; target: string }>;
  };
  hero: {
    badge: string;
    titleLines: string[];
    highlightedLines: number[];
    description: string;
    primaryButton: { label: string; target: string };
    secondaryButton: { label: string; target: string };
    image: string;
  };
  story: {
    title: string;
    paragraphs: string[];
    features: string[];
    image: string;
    quote: string;
  };
  services: {
    title: string;
    subtitle: string;
    items: Array<{ icon: string; title: string; desc: string }>;
  };
  products: {
    title: string;
    subtitle: string;
    viewAllText: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      originalPrice?: number;
      image: string;
      category: string;
      tag?: string;
    }>;
  };
  contact: {
    title: string;
    description: string;
    whatsapp: { number: string; buttonText: string };
  };
  footer: {
    copyright: string;
    socialLinks: Array<{ platform: string; url: string }>;
  };
}

import { SYSTEM_PROMPT } from "./prompt";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1547986280-fdcf1b207d27?q=80&w=1000&auto=format&fit=crop";


async function verifySignature(request: Request, secret: string): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) return false;

  const body = await request.clone().text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const digest = "sha256=" + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === digest;
}

async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string,
  token: string
): Promise<{ content: string; sha?: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "JKD-CMS-AI-Worker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error (${res.status}) for ${path}: ${text}`);
  }

  const data = (await res.json()) as { content: string; sha?: string; encoding: string };
  return {
    content: atob(data.content.replace(/\n/g, "")),
    sha: data.sha,
  };
}

async function commitGitHubFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  token: string,
  existingSha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: btoa(content),
  };
  if (existingSha) body.sha = existingSha;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "JKD-CMS-AI-Worker",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub commit error (${res.status}) for ${path}: ${text}`);
  }
}

async function callDeepSeek(apiKey: string, brief: string): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: brief },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned empty content");
  return content;
}

async function searchPixabay(query: string, apiKey?: string): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("orientation", "horizontal");
    url.searchParams.set("per_page", "3");
    url.searchParams.set("safesearch", "true");

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as { hits?: Array<{ webformatURL?: string; largeImageURL?: string }> };
    const hit = data.hits?.[0];
    return hit?.largeImageURL || hit?.webformatURL || null;
  } catch {
    return null;
  }
}

function stripMarkdownCodeBlocks(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n```$/, "")
      .trim();
  }
  return trimmed;
}

function validateStructure(data: unknown): data is RawSiteContent {
  const d = data as RawSiteContent;
  return (
    d &&
    typeof d.brand?.name === "string" &&
    Array.isArray(d.nav?.items) &&
    Array.isArray(d.hero?.titleLines) &&
    typeof d.hero?.description === "string" &&
    Array.isArray(d.story?.paragraphs) &&
    Array.isArray(d.services?.items) &&
    Array.isArray(d.products?.items) &&
    typeof d.contact?.whatsapp?.number === "string"
  );
}

async function replaceSearchImages(content: RawSiteContent, pixabayKey?: string): Promise<RawSiteContent> {
  const replace = async (value: string): Promise<string> => {
    if (typeof value !== "string" || !value.startsWith("SEARCH:")) return value;
    const query = value.replace("SEARCH:", "").trim();
    const url = await searchPixabay(query, pixabayKey);
    return url || FALLBACK_IMAGE;
  };

  const c = JSON.parse(JSON.stringify(content)) as RawSiteContent;
  c.hero.image = await replace(c.hero.image);
  c.story.image = await replace(c.story.image);
  for (const p of c.products.items) {
    p.image = await replace(p.image);
  }
  return c;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature-256",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      if (env.GITHUB_WEBHOOK_SECRET) {
        const ok = await verifySignature(request, env.GITHUB_WEBHOOK_SECRET);
        if (!ok) {
          return new Response("Invalid signature", { status: 401 });
        }
      }

      const payload = (await request.json()) as {
        repository?: { full_name?: string; name?: string; owner?: { login?: string } };
        ref?: string;
        commits?: Array<{ modified?: string[]; added?: string[]; removed?: string[] }>;
      };

      const fullName = payload.repository?.full_name;
      if (!fullName) {
        return new Response("Missing repository full_name", { status: 400 });
      }

      const [owner, repo] = fullName.split("/");
      if (!owner || !repo) {
        return new Response("Invalid repository full_name", { status: 400 });
      }

      // Only act on pushes that touched brief.txt.
      const changedPaths = (payload.commits || []).flatMap((c) => [
        ...(c.modified || []),
        ...(c.added || []),
        ...(c.removed || []),
      ]);
      if (!changedPaths.some((p) => p === "brief.txt" || p.endsWith("/brief.txt"))) {
        return new Response("brief.txt not changed; ignored", { status: 200 });
      }

      // Fetch brief.txt.
      const briefFile = await fetchGitHubFile(owner, repo, "brief.txt", env.GITHUB_TOKEN);
      const brief = briefFile.content;

      // Generate content via DeepSeek.
      const raw = await callDeepSeek(env.DEEPSEEK_API_KEY, brief);
      const cleaned = stripMarkdownCodeBlocks(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        return new Response(
          `JSON parse error: ${e instanceof Error ? e.message : "unknown"}\n\nRaw output:\n${raw}`,
          { status: 502 }
        );
      }

      if (!validateStructure(parsed)) {
        return new Response(
          `Generated JSON failed structure validation.\n\nJSON:\n${JSON.stringify(parsed, null, 2)}`,
          { status: 502 }
        );
      }

      // Resolve images.
      const withImages = await replaceSearchImages(parsed, env.PIXABAY_API_KEY);

      // Commit to public/data/content.json.
      let existingSha: string | undefined;
      try {
        const existing = await fetchGitHubFile(owner, repo, "public/data/content.json", env.GITHUB_TOKEN);
        existingSha = existing.sha;
      } catch {
        existingSha = undefined;
      }

      await commitGitHubFile(
        owner,
        repo,
        "public/data/content.json",
        JSON.stringify(withImages, null, 2),
        "feat: auto-generate site content from brief.txt via AI",
        env.GITHUB_TOKEN,
        existingSha
      );

      return new Response(
        JSON.stringify({ success: true, repo: fullName }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
