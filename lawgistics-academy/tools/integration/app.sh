#!/usr/bin/env bash
# Builds the app against the integration Supabase and starts it on port 3124,
# for the tests that drive the website in a browser.
#
#   tools/integration/app.sh up      build (into .next-it) and start
#   tools/integration/app.sh down    stop it
#
# The public Supabase address is baked into the browser code at build time,
# so this is a build of its own, kept apart from the normal one.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../.." && pwd)"

down() { pkill -f "[n]ext start -p 3124" >/dev/null 2>&1 || true; pkill -f "[n]ext-server.*3124" >/dev/null 2>&1 || true; }

up() {
  down
  set -a; . "$HERE/.env.it"; set +a
  export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_IT_URL"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_IT_ANON_KEY"
  export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_IT_SERVICE_KEY"
  export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3124
  export SETUP_TOKEN=it-setup-token
  # Two-step sign-in is on: this is what is being tested.
  unset STAFF_TWO_STEP
  cd "$APP"
  # next build adds its output folder to tsconfig.json; put it back after.
  cp tsconfig.json /tmp/lawg-it-tsconfig.json
  NEXT_DIST_DIR=.next-it npx next build >/tmp/lawg-it-build.log 2>&1 || { cp /tmp/lawg-it-tsconfig.json tsconfig.json; tail -20 /tmp/lawg-it-build.log; exit 1; }
  cp /tmp/lawg-it-tsconfig.json tsconfig.json
  (NEXT_DIST_DIR=.next-it npx next start -p 3124 >/tmp/lawg-it-app.log 2>&1 &)
  for _ in $(seq 1 60); do curl -fsS -o /dev/null http://127.0.0.1:3124/login && break; sleep 1; done
  echo "App on http://127.0.0.1:3124"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *) echo "usage: $0 up | down" >&2; exit 2 ;;
esac
