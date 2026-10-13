#!/usr/bin/env bash
# A throwaway Supabase: the same open-source services Supabase runs (Postgres
# with Supabase's extensions and roles, Auth, the REST API and Storage), on
# this machine, for the integration tests. Nothing here talks to a real
# project.
#
#   tools/integration/stack.sh up [base]   start it and load the database
#   tools/integration/stack.sh down        stop it and throw everything away
#
# "base" is optional: a git commit whose SETUP.sql is loaded first, with the
# current UPDATE.sql pasted on top, which is how a live database is updated.
# Without it the current SETUP.sql is loaded on its own.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../.." && pwd)"
NET=lawg-it
PW=it-postgres-password-not-secret
JWT_SECRET=it-jwt-secret-at-least-32-characters-long
PG_IMAGE=supabase/postgres:17.11.0.004
AUTH_IMAGE=supabase/gotrue:v2.197.0
REST_IMAGE=postgrest/postgrest:v16.4
STORAGE_IMAGE=supabase/storage-api:v1.81.1
PG_PORT=54329

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
jwt() {
  local header payload sig
  header=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
  payload=$(printf '{"role":"%s","iss":"supabase-it","iat":1700000000,"exp":2000000000}' "$1" | b64url)
  sig=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)
  printf '%s.%s.%s' "$header" "$payload" "$sig"
}

psql_admin() { docker exec -i lawg-it-db psql -v ON_ERROR_STOP=1 -q -U supabase_admin -d postgres "$@"; }
psql_postgres() { PGPASSWORD=$PW PGOPTIONS="-c client_min_messages=warning" psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p $PG_PORT -U postgres -d postgres "$@"; }

wait_for() {
  local what=$1 url=$2
  for _ in $(seq 1 90); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then return 0; fi
    sleep 1
  done
  echo "$what did not start" >&2
  docker logs --tail 40 "lawg-it-$what" >&2 || true
  exit 1
}

down() {
  docker rm -f lawg-it-db lawg-it-auth lawg-it-rest lawg-it-storage >/dev/null 2>&1 || true
  docker network rm $NET >/dev/null 2>&1 || true
  pkill -f "[t]ools/integration/gateway.mjs" >/dev/null 2>&1 || true
}

up() {
  local base=${1:-}
  down
  docker network create $NET >/dev/null
  ANON=$(jwt anon)
  SERVICE=$(jwt service_role)

  docker run -d --name lawg-it-db --network $NET -p 127.0.0.1:$PG_PORT:5432 \
    -e POSTGRES_PASSWORD=$PW -e JWT_SECRET=$JWT_SECRET -e JWT_EXP=3600 \
    $PG_IMAGE postgres -c config_file=/etc/postgresql/postgresql.conf >/dev/null
  for _ in $(seq 1 120); do
    if docker exec lawg-it-db pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 \
      && psql_admin -c 'select 1' >/dev/null 2>&1; then break; fi
    sleep 1
  done
  # The image's own init can restart the server once; wait for it to settle.
  sleep 3
  for _ in $(seq 1 60); do psql_admin -c 'select 1' >/dev/null 2>&1 && break; sleep 1; done

  # The service roles log in with the database password, as in Supabase's own
  # self-hosting files.
  psql_admin <<SQL
alter user authenticator with password '$PW';
alter user supabase_auth_admin with password '$PW';
alter user supabase_storage_admin with password '$PW';
alter user postgres with password '$PW';
alter database postgres set "app.settings.jwt_secret" to '$JWT_SECRET';
SQL

  docker run -d --name lawg-it-auth --network $NET -p 127.0.0.1:9998:9999 \
    -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 \
    -e API_EXTERNAL_URL=http://127.0.0.1:8100/auth/v1 \
    -e GOTRUE_DB_DRIVER=postgres \
    -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:$PW@lawg-it-db:5432/postgres" \
    -e GOTRUE_SITE_URL=http://127.0.0.1:3123 \
    -e GOTRUE_URI_ALLOW_LIST='*' \
    -e GOTRUE_JWT_SECRET=$JWT_SECRET -e GOTRUE_JWT_EXP=3600 -e GOTRUE_JWT_AUD=authenticated \
    -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated -e GOTRUE_JWT_ADMIN_ROLES=service_role \
    -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true -e GOTRUE_MAILER_AUTOCONFIRM=true \
    -e GOTRUE_DISABLE_SIGNUP=false \
    -e GOTRUE_MFA_TOTP_ENROLL_ENABLED=true -e GOTRUE_MFA_TOTP_VERIFY_ENABLED=true \
    -e GOTRUE_MFA_MAX_ENROLLED_FACTORS=10 \
    -e GOTRUE_RATE_LIMIT_VERIFY=10000 -e GOTRUE_RATE_LIMIT_TOKEN_REFRESH=10000 \
    -e GOTRUE_RATE_LIMIT_EMAIL_SENT=10000 -e GOTRUE_RATE_LIMIT_OTP=10000 \
    $AUTH_IMAGE >/dev/null
  wait_for auth http://127.0.0.1:9998/health

  docker run -d --name lawg-it-storage --network $NET -p 127.0.0.1:5998:5000 \
    -e ANON_KEY="$ANON" -e SERVICE_KEY="$SERVICE" \
    -e AUTH_JWT_SECRET=$JWT_SECRET -e PGRST_JWT_SECRET=$JWT_SECRET \
    -e AUTH_JWT_ALGORITHM=HS256 \
    -e POSTGREST_URL=http://lawg-it-rest:3000 \
    -e DATABASE_URL="postgres://supabase_storage_admin:$PW@lawg-it-db:5432/postgres" \
    -e FILE_SIZE_LIMIT=52428800 -e STORAGE_BACKEND=file \
    -e FILE_STORAGE_BACKEND_PATH=/var/lib/storage \
    -e TENANT_ID=stub -e REGION=stub -e GLOBAL_S3_BUCKET=stub \
    -e ENABLE_IMAGE_TRANSFORMATION=false \
    $STORAGE_IMAGE >/dev/null
  wait_for storage http://127.0.0.1:5998/status

  # The app's database, the way a firm sets one up: SETUP.sql in the SQL
  # editor as the postgres user, and later UPDATE.sql on top.
  if [ -n "$base" ]; then
    git -C "$APP" show "$base:lawgistics-academy/supabase/SETUP.sql" | psql_postgres -f - >/dev/null
    psql_postgres -f "$APP/supabase/UPDATE.sql" >/dev/null
  else
    psql_postgres -f "$APP/supabase/SETUP.sql" >/dev/null
  fi

  docker run -d --name lawg-it-rest --network $NET -p 127.0.0.1:3998:3000 \
    -e PGRST_DB_URI="postgres://authenticator:$PW@lawg-it-db:5432/postgres" \
    -e PGRST_DB_SCHEMAS=public,storage,graphql_public \
    -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET=$JWT_SECRET \
    -e PGRST_DB_USE_LEGACY_GUCS=false \
    -e PGRST_APP_SETTINGS_JWT_SECRET=$JWT_SECRET -e PGRST_APP_SETTINGS_JWT_EXP=3600 \
    $REST_IMAGE >/dev/null
  wait_for rest http://127.0.0.1:3998/

  (node "$HERE/gateway.mjs" >/tmp/lawg-it-gateway.log 2>&1 &)
  wait_for gateway http://127.0.0.1:8100/auth/v1/health

  cat >"$HERE/.env.it" <<ENV
SUPABASE_IT_URL=http://127.0.0.1:8100
SUPABASE_IT_ANON_KEY=$ANON
SUPABASE_IT_SERVICE_KEY=$SERVICE
SUPABASE_IT_DB_URL=postgres://postgres:$PW@127.0.0.1:$PG_PORT/postgres
SUPABASE_IT_ADMIN_CONTAINER=lawg-it-db
ENV
  echo "Integration Supabase is up at http://127.0.0.1:8100"
}

case "${1:-}" in
  up) shift; up "${1:-}" ;;
  down) down ;;
  *) echo "usage: $0 up [base-commit] | down" >&2; exit 2 ;;
esac
