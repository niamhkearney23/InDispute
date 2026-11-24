// Three stand-ins so nothing real is ever called:
//   5599  Anthropic   (the SDK honours ANTHROPIC_BASE_URL)
//   5597  OpenAI      (the app honours OPENAI_API_BASE)
//   5598  Resend      (the app honours RESEND_API_BASE)
// Each has /__mode (set behaviour) and /__log (what it was asked), so a test can check what was sent.
import http from 'node:http';
const DRAFT = (who) => ({
  kicker: '', cite: '', caption: 'A first line.\n\nA second line.',
  slides: [
    { layout: 'title', ground: 'light', size: 'lg', swipe: true, statement: `${who} wrote this opening line`, sub: 'And a sub line under it' },
    { layout: 'essay', ground: 'dark', size: 'md', statement: 'The argument in one slide', body: 'Some real body copy that says something.' },
  ],
});
// what OpenAI really says to a bad key, including the masked tail of the key it was sent
const BAD_KEY = { error: { message: 'Incorrect API key provided: sk-proj-********************************************ufYA. You can find your API key at https://platform.openai.com/account/api-keys.', type: 'invalid_request_error' } };

function server(port, name, handler) {
  const st = { mode: 'ok', log: [] };
  http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const send = (code, obj) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); };
      if (req.url === '/__mode') { st.mode = body.trim(); return res.end('ok'); }
      if (req.url === '/__reset') { st.log = []; return res.end('ok'); }
      if (req.url === '/__log') return send(200, st.log);
      st.log.push({ method: req.method, url: req.url, auth: req.headers.authorization || req.headers['x-api-key'] || '', body: body.slice(0, 20000) });
      handler(req, body, st, send);
    });
  }).listen(port, '127.0.0.1', () => console.log(`${name} on ${port}`));
}

server(5599, 'anthropic', (req, body, st, send) => {
  if (st.mode === 'reject') return send(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
  if (st.mode === 'fail') return send(500, { type: 'error', error: { type: 'api_error', message: 'model down' } });
  if (req.method === 'GET') return send(200, { data: [{ id: 'claude-opus-5' }] });
  send(200, { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5',
    content: [{ type: 'text', text: JSON.stringify(DRAFT('Claude')) }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
});

server(5597, 'openai', (req, body, st, send) => {
  if (st.mode === 'reject') return send(401, BAD_KEY);
  if (st.mode === 'fail') return send(500, { error: { message: 'openai is down' } });
  if (req.url.startsWith('/v1/models')) return send(200, { data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'gpt-5' }, { id: 'text-embedding-3-large' }] });
  if (st.mode === 'verify' && req.url.startsWith('/v1/images') && body.includes('gpt-image-1')) return send(403, { error: { message: 'Your organization must be verified to use the model `gpt-image-1`.' } });
  if (st.mode === 'leak' && !req.url.startsWith('/v1/models')) return send(400, { error: { message: 'Invalid prompt: SECRET-PROMPT-TEXT sk-live-ABCDEFGH1234' } });
  if (req.url.startsWith('/v1/images')) return send(200, { data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }] });
  send(200, { choices: [{ message: { content: JSON.stringify(DRAFT('ChatGPT')) } }] });
});

server(5598, 'resend', (req, body, st, send) => {
  if (st.mode === 'fail500') return send(500, { message: 'resend is having a moment' });
  if (st.mode === 'reject') return send(422, { message: 'The from domain is not verified' });
  send(200, { id: 'email_test' });
});
