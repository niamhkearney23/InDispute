// The one address the Supabase client talks to, as on a real project:
// /auth/v1 goes to Auth, /rest/v1 to the REST API, /storage/v1 to Storage.
// Supabase runs a gateway (Kong) for this; for the tests a few lines do.
import http from 'node:http';

const ROUTES = [
  ['/auth/v1', 9998],
  ['/rest/v1', 3998],
  ['/storage/v1', 5998],
];

// What Supabase's gateway adds so a browser on the app's own address may call
// it: answer the preflight, and name the caller's origin on every response.
function cors(req) {
  return {
    'access-control-allow-origin': req.headers.origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
    'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
    'access-control-expose-headers': 'content-range, x-total-count, content-length',
    'access-control-max-age': '600',
  };
}

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors(req)).end();
      return;
    }
    const route = ROUTES.find(([prefix]) => req.url === prefix || req.url.startsWith(`${prefix}/`) || req.url.startsWith(`${prefix}?`));
    if (!route) {
      res.writeHead(404).end();
      return;
    }
    const [prefix, port] = route;
    const upstream = http.request(
      {
        host: '127.0.0.1',
        port,
        method: req.method,
        path: req.url.slice(prefix.length) || '/',
        headers: { ...req.headers, host: `127.0.0.1:${port}` },
      },
      (up) => {
        res.writeHead(up.statusCode ?? 502, { ...up.headers, ...cors(req) });
        up.pipe(res);
      },
    );
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  })
  .listen(8100, '127.0.0.1');
