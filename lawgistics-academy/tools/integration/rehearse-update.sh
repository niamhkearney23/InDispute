#!/usr/bin/env bash
# Rehearses this release's database update the way the live site will take
# it: a database built from the SETUP.sql the live site was set up from,
# filled with production-like data, then today's UPDATE.sql pasted on top,
# twice, with the before and after checks a person runs in the SQL editor.
# Then the integration tests run against the updated database.
#
#   tools/integration/rehearse-update.sh <base-commit>
#
# The output lands in tools/integration/rehearsal-<base>/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../.." && pwd)"
BASE=${1:?which commit was the live database set up from?}
OUT="$HERE/rehearsal-$BASE"
mkdir -p "$OUT"

SKIP_UPDATE=1 "$HERE/stack.sh" up "$BASE"
set -a; . "$HERE/.env.it"; set +a
run_sql() { PGOPTIONS="-c client_min_messages=warning" psql "$SUPABASE_IT_DB_URL" -v ON_ERROR_STOP=1 "$@"; }

cd "$APP"
npx tsx --conditions=react-server tests-integration/rehearsal/production-like.ts
# As on a restored copy: prepare it as staging first (docs/RELEASE.md, 1).
run_sql -f supabase/staging/prepare-staging.sql >"$OUT/0-prepare-staging.txt"
run_sql -f supabase/checks/before-update.sql >"$OUT/1-before.txt"
HELPERS="select string_agg(pg_get_functiondef(p.oid), E'\n' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('is_admin', 'is_coach', 'is_firm_admin')"
run_sql -At -c "$HELPERS" >"$OUT/helpers-before.txt"

# As the SQL editor runs it: the postgres user, the whole file, stop at the
# first error.
run_sql -q -f supabase/UPDATE.sql >"$OUT/2-update-first-paste.txt" 2>&1
run_sql -f supabase/checks/after-update.sql >"$OUT/3-after-first-paste.txt"

# Pasting it again must be harmless.
run_sql -q -f supabase/UPDATE.sql >"$OUT/4-update-second-paste.txt" 2>&1
run_sql -f supabase/checks/after-update.sql >"$OUT/5-after-second-paste.txt"

# Fail-secure rollback (docs/ROLLBACK.md) never touches the database: the
# release's controls stay. What is checked here instead is that pasting the
# update yet again, as the route back after a restore would, is harmless.
run_sql -q -f supabase/UPDATE.sql >"$OUT/6-update-third-paste.txt" 2>&1
run_sql -f supabase/checks/after-update.sql >"$OUT/7-after-third-paste.txt"
run_sql -At -c "$HELPERS" >"$OUT/helpers-after.txt"
if ! grep -q staff_session_checked "$OUT/helpers-after.txt"; then
  echo "the staff checks do not require the code after the update" >&2
  exit 1
fi

# PostgREST caches the schema; a real project reloads it on its own.
run_sql -q -c "notify pgrst, 'reload schema'; notify pgrst, 'reload config';"
sleep 2

if grep -q "NOT OK" "$OUT/3-after-first-paste.txt" "$OUT/5-after-second-paste.txt" "$OUT/7-after-third-paste.txt"; then
  echo "A check failed after the update; see $OUT" >&2
  exit 1
fi
echo "Rehearsal of the update from $BASE: every check OK. Output in $OUT"
