// Claude API proxy as a Netlify Function — the deployed twin of serve.py's
// /claude route. The API key lives in Netlify's environment settings
// (Site settings -> Environment variables -> ANTHROPIC_API_KEY) and never
// reaches the browser.

// This forwarded whatever it was given: any model, any size, from any origin,
// at any rate, on our key and our bill. The Vercel twin has always checked all
// four. Keep these two files in step, and keep the values identical.
const ALLOWED_HOSTS = [
  /^lawgistics[a-z0-9-]*\.(vercel|netlify)\.app$/i,
  /^([a-z0-9-]+\.)?lawgistics\.my$/i,
  /^localhost(:\d+)?$/i,
  /^127\.0\.0\.1(:\d+)?$/i,
];
const ALLOWED_MODELS = ["claude-opus-5", "claude-fable-5", "claude-haiku-4-5"];
const MAX_TOKENS_CAP = 16000;
const MAX_BODY_BYTES = 16 * 1024 * 1024;
const RATE_LIMIT = { windowMs: 60 * 1000, max: 12 };

const hits = new Map();

function hostOf(value) {
  if (!value) return "";
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

function allowedOrigin(req) {
  const host = hostOf(req.headers.get("origin")) || hostOf(req.headers.get("referer"));
  if (!host) return false;
  // Same origin, for the reason given in the Vercel twin: a deployment cannot
  // know its own name in advance, and guessing wrong is a silent 403.
  if (host.toLowerCase() === new URL(req.url).host.toLowerCase()) return true;
  return ALLOWED_HOSTS.some((re) => re.test(host));
}

function rateLimited(req) {
  const ip = String(req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const now = Date.now();
  const seen = hits.get(ip);
  if (!seen || now - seen.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  seen.count += 1;
  return seen.count > RATE_LIMIT.max;
}

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY || "";
  const url = new URL(req.url);

  if (url.pathname.endsWith("/health")) {
    return Response.json({ enabled: !!key });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }
  if (!allowedOrigin(req)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (rateLimited(req)) {
    return Response.json({ error: "too many requests" }, { status: 429 });
  }
  if (!key) {
    return Response.json({ error: "no_api_key" }, { status: 503 });
  }

  let body;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !Array.isArray(body.messages)) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  if (!ALLOWED_MODELS.includes(body.model)) {
    return Response.json({ error: "model not allowed" }, { status: 400 });
  }
  body.max_tokens = Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP);

  const payload = JSON.stringify(body);
  if (new TextEncoder().encode(payload).length > MAX_BODY_BYTES) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: payload,
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
