#!/usr/bin/env bash
# End to end tests for lawgistics-marketing.
#
#   bash tests/run.sh              run every suite
#   bash tests/run.sh security ux  run just those
#
# Nothing real is ever called. The firm layer runs against PGlite (Postgres compiled to WASM,
# speaking the real wire protocol to the real `pg` driver). OpenAI, Anthropic and Resend are
# replaced by local stand-ins (fakes.mjs) that record what they were sent.
#
# First time:  (cd tests && npm install)      and set CHROMIUM_PATH if Playwright has no browser,
#              for example CHROMIUM_PATH=/opt/pw-browsers/chromium
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/.." && pwd)"
RUN="$HERE/.run"; mkdir -p "$RUN/shots"
PORT=3010
OWNER_KEY="owner-key-that-is-long-enough-123456"
SESSION_SECRET="session-secret-that-is-comfortably-over-32-chars"

[ -d "$HERE/node_modules/@electric-sql" ] || { echo "Run:  (cd tests && npm install)"; exit 2; }

stop_all() {
  fuser -k "$PORT/tcp" >/dev/null 2>&1
  pkill -f "next start -p $PORT" 2>/dev/null
  pkill -f "node $HERE/serve.mjs" 2>/dev/null
  pkill -f "node $HERE/fakes.mjs" 2>/dev/null
  sleep 1
}
trap stop_all EXIT

# boot [VAR=value ...]  -> a fresh database, fresh stand-ins, and the app with those settings.
# A later VAR=value wins, and VAR= (empty) switches a setting off.
boot() {
  stop_all
  (cd "$HERE" && setsid node serve.mjs > "$RUN/db.log" 2>&1 < /dev/null &)
  (cd "$HERE" && setsid node fakes.mjs > "$RUN/fakes.log" 2>&1 < /dev/null &)
  sleep 4
  (cd "$APP" && env -u OPENAI_API_KEY -u OPENAI_BASE_URL -u OPENAI_DRAFT_MODEL -u DRAFT_PROVIDER -u ACCESS_CODES \
      -u APP_URL -u BOOKING_URL -u RESEND_API_KEY -u EMAIL_FROM -u VERCEL_ENV -u VERCEL_URL -u VERCEL_PROJECT_PRODUCTION_URL \
    DATABASE_URL=postgresql://postgres@127.0.0.1:5544/postgres DB_POOL_MAX=1 \
    SESSION_SECRET="$SESSION_SECRET" OWNER_KEY="$OWNER_KEY" \
    ANTHROPIC_API_KEY=fake DRAFT_PROVIDER=anthropic ANTHROPIC_BASE_URL=http://127.0.0.1:5599 \
    "$@" setsid npx next start -p "$PORT" > "$RUN/app.log" 2>&1 < /dev/null &)
  for _ in $(seq 1 30); do curl -s -m 2 "localhost:$PORT/api/firm/me" >/dev/null 2>&1 && return 0; sleep 1; done
  echo "the app did not start, see $RUN/app.log"; return 1
}
fake() { curl -s -m 5 -X POST "localhost:$1$2" -d "${3:-}" >/dev/null; }
reset_fakes() { for p in 5599 5597 5598; do fake $p /__mode ok; fake $p /__reset; done; }

MAIN=(DRAFT_PROVIDER= OPENAI_API_KEY=fake-openai OPENAI_API_BASE=http://127.0.0.1:5597
      RESEND_API_KEY=fake-resend "EMAIL_FROM=Lawgistics <invites@example.com>" RESEND_API_BASE=http://127.0.0.1:5598
      "BOOKING_URL=https://cal.example.com/book?x=1")

suite_api()      { boot; (cd "$HERE" && node apitest.mjs); }
suite_main()     { boot "${MAIN[@]}"; reset_fakes; (cd "$HERE" && node newtests.mjs main); }
suite_rejected() { boot "${MAIN[@]}"; reset_fakes; fake 5597 /__mode reject; (cd "$HERE" && node newtests.mjs rejected); }
suite_off()      { boot DRAFT_PROVIDER=; reset_fakes; (cd "$HERE" && node newtests.mjs off); }
suite_security() { boot "${MAIN[@]}" VERCEL_ENV=production VERCEL_PROJECT_PRODUCTION_URL=app.example.com; reset_fakes; (cd "$HERE" && node securitytests.mjs); }
suite_modes_off(){ boot DATABASE_URL=; (cd "$HERE" && node modes.mjs off); }
suite_modes_gate(){ boot ACCESS_CODES=solo-code-1,other-code; (cd "$HERE" && node modes.mjs gate); }
suite_ux()       { boot; (cd "$HERE" && node uxtests.cjs "$RUN/shots/ux"); }
suite_photo()    { boot; (cd "$HERE" && node photo.cjs "$RUN/shots/photo.png"); }
suite_ui()       { boot "${MAIN[@]}" ACCESS_CODES=letmein; reset_fakes; (cd "$HERE" && node ui.cjs "$RUN/shots/ui"); }

ALL=(api main rejected off security modes_off modes_gate ux photo ui)
WANT=("$@"); [ ${#WANT[@]} -eq 0 ] || [ "${WANT[0]}" = all ] && WANT=("${ALL[@]}")
FAILED=()
for s in "${WANT[@]}"; do
  name="${s//-/_}"
  echo; echo "################ $s"
  if ! declare -F "suite_$name" >/dev/null; then echo "no such suite: $s (have: ${ALL[*]})"; FAILED+=("$s"); continue; fi
  "suite_$name" || FAILED+=("$s")
done
echo
if [ ${#FAILED[@]} -eq 0 ]; then echo "ALL SUITES PASSED"; else echo "FAILED: ${FAILED[*]}"; exit 1; fi
