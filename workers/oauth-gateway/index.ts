/**
 * GitHub OAuth Gateway for Decap CMS
 *
 * Shared by all cloned sites. Decap CMS redirects users here to obtain a
 * GitHub access token, which is then posted back to the CMS window.
 *
 * Environment variables (encrypted):
 *   GITHUB_CLIENT_ID     - GitHub OAuth App Client ID
 *   GITHUB_CLIENT_SECRET - GitHub OAuth App Client Secret
 */

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function htmlResponse(content: string, status = 200): Response {
  return new Response(content, {
    status,
    headers: { "Content-Type": "text/html", ...CORS_HEADERS },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // /auth - redirect to GitHub OAuth
    if (url.pathname === "/auth") {
      const state = url.searchParams.get("state") || "";
      const redirectUri = `${url.origin}/callback`;
      const githubUrl = new URL("https://github.com/login/oauth/authorize");
      githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      githubUrl.searchParams.set("redirect_uri", redirectUri);
      githubUrl.searchParams.set("scope", "repo");
      githubUrl.searchParams.set("state", state);

      return Response.redirect(githubUrl.toString(), 302);
    }

    // /callback - exchange code for token and postMessage back to Decap CMS
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return htmlResponse("<h1>Missing authorization code</h1>", 400);
      }

      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        }
      );

      if (!tokenRes.ok) {
        return htmlResponse("<h1>GitHub token exchange failed</h1>", 502);
      }

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenData.access_token) {
        return htmlResponse(
          `<h1>OAuth error</h1><pre>${JSON.stringify(tokenData, null, 2)}</pre>`,
          400
        );
      }

      const payload = JSON.stringify({
        token: tokenData.access_token,
        provider: "github",
      });

      return htmlResponse(`<!DOCTYPE html>
<html>
  <head><title>OAuth Callback</title></head>
  <body>
    <p>Authorization complete. You can close this window.</p>
    <script>
      (function() {
        var payload = ${payload.replace(/</g, "\\u003c")};
        if (window.opener) {
          window.opener.postMessage(payload, "*");
          setTimeout(function() { window.close(); }, 300);
        } else {
          document.body.innerHTML = "<p>Please close this window and return to the admin panel.</p>";
        }
      })();
    </script>
  </body>
</html>`);
    }

    return jsonResponse({ ok: true, gateway: "JKD CMS OAuth Gateway" });
  },
};
