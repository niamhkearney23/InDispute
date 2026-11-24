# Tests

End to end tests for the studio and the firm workspace. About 300 checks across ten suites.

```
(cd tests && npm install)      # once
bash tests/run.sh              # everything
bash tests/run.sh security ux  # just some
```

Needs the app built (`npm run build`) and, for the browser suites, a browser. If Playwright
has none, point `CHROMIUM_PATH` at a Chromium binary.

**Nothing real is called.** The database is PGlite (Postgres compiled to WASM) serving the real
wire protocol to the real `pg` driver. OpenAI, Anthropic and Resend are replaced by local
stand-ins in `fakes.mjs` that record what they were sent, and can be told to reject a key, fail,
leak a secret in an error, and so on.

| Suite | What it covers |
|---|---|
| `api` | Tenant isolation, forged sessions, origins, approval rules, people, allowance, expiry |
| `main` | Invite emails (recipient, link, escaping, the daily cap, failures), booking link, key checks |
| `rejected` | A rejected OpenAI key: automatic fallback to Claude, no key fragment in any reply |
| `off` | Email and booking link not configured |
| `security` | Regression tests for every issue in the security audit |
| `modes_off`, `modes_gate` | The firm layer switched off, and access codes combined with accounts |
| `ux` | Back button, focus, labels, landmarks, previews, robots, phone layout, the sales page |
| `photo` | A post with photos over the size limit submits, and approval survives the lighter copy |
| `ui` | The People tab, the invite card, the access gate link |

Two honest limits. PGlite runs every connection on one shared backend, so it proves the logic but
cannot show two requests racing across real connections: the allowance's correctness under true
parallelism rests on a row lock that was reasoned, not exercised. And the stand-ins prove what the
app sends and how it reacts, not that a real provider accepts your key or your sending domain.
