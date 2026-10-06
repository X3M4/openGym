#!/usr/bin/env bash
# SuperOpenGym — local development.
#
#   ./dev.sh [up]        build and start the dev stack (hot reload) on http://localhost:8095
#   ./dev.sh down        stop it (data in ./data-dev is kept)
#   ./dev.sh restart     down + up
#   ./dev.sh logs [svc]  follow the logs (web, api, mediasrv)
#   ./dev.sh status      containers and the API's health
#   ./dev.sh test        frontend and API test suites, on the host
#   ./dev.sh phone       build the debug APK (SuperOpenGymTest), install it on the USB phone and
#                        forward the dev stack to it (adb reverse)
#   ./dev.sh reset-data  delete ./data-dev (asks first)
#
# The stack is docker-compose.dev.yml under the project name superopengym-dev, so it never
# touches another openGym running on this machine, nor ./data of a production stack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
PROJECT=superopengym-dev
DEV_PORT="${DEV_PORT:-8095}"
export DEV_PORT DEV_ORIGIN="http://localhost:$DEV_PORT"
compose() { docker compose -p "$PROJECT" -f docker-compose.dev.yml "$@"; }

ensure_env() {
  if [ ! -f .env.dev ]; then
    cp .env.dev.example .env.dev
    echo "· .env.dev created from .env.dev.example"
  fi
  mkdir -p data-dev media/img media/gif
}

wait_ready() {
  printf '· Waiting for the dev server'
  for _ in $(seq 1 120); do
    if curl -fsS "http://localhost:$DEV_PORT/api/health" >/dev/null 2>&1; then
      echo " ✓"; return 0
    fi
    printf '.'; sleep 2
  done
  echo; echo "✗ Not ready after 4 minutes — see ./dev.sh logs" >&2; return 1
}

cmd_up() {
  ensure_env
  compose up -d --build
  wait_ready
  echo
  echo "SuperOpenGym (dev) → http://localhost:$DEV_PORT"
  echo "Data: ./data-dev   Logs: ./dev.sh logs   Phone: ./dev.sh phone"
}

cmd_status() {
  compose ps
  echo
  curl -fsS "http://localhost:$DEV_PORT/api/health" && echo || echo "API not answering on :$DEV_PORT"
}

cmd_test() {
  (cd frontend && npx vitest run)
  (cd api && npm test)
}

cmd_phone() {
  command -v adb >/dev/null || { echo "adb not found" >&2; exit 1; }
  local serial
  serial="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
  [ -n "$serial" ] || { echo "No phone in 'adb devices' — connect it with USB debugging on." >&2; exit 1; }
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

  (cd frontend && npm run build:mobile)
  (cd frontend/android && ./gradlew --no-daemon assembleDebug)
  adb -s "$serial" install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
  # The phone's 127.0.0.1:<port> is this machine's dev server, for as long as the cable is in.
  adb -s "$serial" reverse "tcp:$DEV_PORT" "tcp:$DEV_PORT"
  adb -s "$serial" shell monkey -p com.chemafernandez.superopengym.test -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

  cat <<EOF

SuperOpenGymTest is installed and the dev stack is forwarded to the phone.
To pair it:
  1. On this computer open http://localhost:$DEV_PORT, sign in, and go to
     Settings → "Pair the mobile app" to get a one-time code.
  2. In the app choose "Connect to my server" and enter
       server:  http://127.0.0.1:$DEV_PORT
       code:    the one from step 1
The forwarding ends when the cable is unplugged: run ./dev.sh phone again (or just
adb reverse tcp:$DEV_PORT tcp:$DEV_PORT).
EOF
}

cmd_reset_data() {
  read -r -p "Delete ./data-dev (every dev profile and workout)? [y/N] " a
  [ "$a" = y ] || [ "$a" = Y ] || { echo "Nothing deleted."; return; }
  compose down
  # Written by the container as root: removed from inside one.
  docker run --rm -v "$ROOT/data-dev:/d" alpine sh -c 'rm -rf /d/* /d/.[!.]* 2>/dev/null; true'
  echo "✓ ./data-dev emptied"
}

case "${1:-up}" in
  up)         cmd_up ;;
  down)       compose down ;;
  restart)    compose down; cmd_up ;;
  logs)       shift; compose logs -f --tail=200 "$@" ;;
  status)     cmd_status ;;
  test)       cmd_test ;;
  phone)      cmd_phone ;;
  reset-data) cmd_reset_data ;;
  *) sed -n '2,15p' "$0"; exit 1 ;;
esac
