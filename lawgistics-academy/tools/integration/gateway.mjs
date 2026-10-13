// The one address the Supabase client talks to, as on a real project:
// /auth/v1 goes to Auth, /rest/v1 to the REST API, /storage/v1 to Storage.
// Supabase runs a gateway (Kong) for this; for the tests a few lines do.
import http from 'node:http';

const ROUTES = [
  ['/auth/v1', 9998],
  ['/rest/v1', 3998],
  ['/storage/v1', 5998],
];

http
  .createServer((req, res) => {
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
        res.writeHead(up.statusCode ?? 502, up.headers);
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
