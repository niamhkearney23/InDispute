// Claude API proxy as a Vercel serverless function — the deployed twin of
// serve.py's /claude route. Set ANTHROPIC_API_KEY in the Vercel project's
// Environment Variables; it never reaches the browser.
//
// The key is ours and the billing is ours, so this endpoint is not a general
// purpose Claude gateway: it only serves our own pages, only the model those
// pages use, and only at a sane size and rate.

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: "16mb" } } };

const ALLOWED_HOSTS = [
  /^lawgistics[a-z0-9-]*\.vercel\.app$/i,   // our Vercel projects and previews
  /^([a-z0-9-]+\.)?lawgistics\.my$/i,       // the live domain
  /^localhost(:\d+)?$/i,
  /^127\.0\.0\.1(:\d+)?$/i,
];

const ALLOWED_MODELS = ["claude-haiku-4-5"];
const MAX_TOKENS_CAP = 4000;
const MAX_BODY_BYTES = 16 * 1024 * 1024;   // invoice photos travel as base64
const RATE_LIMIT = { windowMs: 60 * 1000, max: 12 };

// Per-instance counter. Serverless means several instances, so this is a
// blunt-force brake on one client hammering us, not an exact quota.
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
  const host = hostOf(req.headers.origin) || hostOf(req.headers.referer);
  if (!host) return false;
  return ALLOWED_HOSTS.some((re) => re.test(host));
}

function rateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
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

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY || "";

  if (req.query && req.query.health !== undefined) {
    return res.status(200).json({ enabled: !!key });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  if (!allowedOrigin(req)) {
    return res.status(403).json({ error: "forbidden" });
  }
  if (rateLimited(req)) {
    return res.status(429).json({ error: "too many requests" });
  }
  if (!key) {
    return res.status(503).json({ error: "no_api_key" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "bad json" });
    }
  }
  if (!body || typeof body !== "object" || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "bad request" });
  }
  if (!ALLOWED_MODELS.includes(body.model)) {
    return res.status(400).json({ error: "model not allowed" });
  }
  body.max_tokens = Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP);

  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload, "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "payload too large" });
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
    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch {
    res.status(502).json({ error: "upstream_unreachable" });
  }
}
