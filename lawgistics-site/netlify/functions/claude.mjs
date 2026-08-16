// Claude API proxy as a Netlify Function — the deployed twin of serve.py's
// /claude route. The API key lives in Netlify's environment settings
// (Site settings -> Environment variables -> ANTHROPIC_API_KEY) and never
// reaches the browser.

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY || "";
  const url = new URL(req.url);

  if (url.pathname.endsWith("/health")) {
    return Response.json({ enabled: !!key });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }
  if (!key) {
    return Response.json({ error: "no_api_key" }, { status: 503 });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: await req.text(),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json({ error: "upstream_unreachable" }, { status: 502 });
  }
};

export const config = { path: ["/claude", "/claude/health"] };
