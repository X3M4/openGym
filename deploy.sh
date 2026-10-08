#!/usr/bin/env bash
# SuperOpenGym — production deploy to the VPS.
#
#   ./deploy.sh init          one time: prepare the VPS (directory, .env, GHCR login) and print
#                             the Nginx server block to install there
#   ./deploy.sh [deploy]      test, build the images, push them to GHCR, back up the VPS data and
#                             roll the stack to this commit
#   ./deploy.sh rollback TAG  run an earlier image tag (a commit's short SHA) again
#   ./deploy.sh status        containers and health on the VPS
#   ./deploy.sh logs [svc]    follow the VPS logs (api, web)
#
# Settings come from ./deploy.env (copy deploy.env.example). Images go to GHCR as
# <IMAGE_PREFIX>-api and -web, tagged with the commit's short SHA and `latest`; the VPS never
# builds anything. Flags for deploy: --skip-tests, --allow-dirty.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
[ -f deploy.env ] || { echo "Missing deploy.env — cp deploy.env.example deploy.env and fill it in." >&2; exit 1; }
# shellcheck disable=SC1091
. ./deploy.env
: "${VPS_SSH:?set VPS_SSH in deploy.env}" "${VPS_DIR:?}" "${DOMAIN:?}" "${WEB_PORT:?}" "${GHCR_USER:?}"
IMAGE_PREFIX="${IMAGE_PREFIX:-ghcr.io/$(echo "$GHCR_USER" | tr '[:upper:]' '[:lower:]')/superopengym}"
PLATFORM="${PLATFORM:-linux/amd64}"
BACKUPS_KEEP="${BACKUPS_KEEP:-10}"

remote() { ssh -o BatchMode=yes "$VPS_SSH" "$@"; }
# Compose on the VPS, from its directory, with its .env.
rcompose() { remote "cd '$VPS_DIR' && docker compose $*"; }

health() {
  printf '· https://%s/api/health ' "$DOMAIN"
  for _ in $(seq 1 30); do
    if curl -fsS "https://$DOMAIN/api/health" >/dev/null 2>&1; then echo "✓"; return 0; fi
    printf '.'; sleep 2
  done
  echo; echo "✗ No healthy answer from https://$DOMAIN/api/health" >&2; return 1
}

# Set (or add) one KEY=value in the VPS's .env.
remote_env_set() {
  remote "cd '$VPS_DIR' && if grep -q '^$1=' .env; then sed -i 's|^$1=.*|$1=$2|' .env; else echo '$1=$2' >> .env; fi"
}

cmd_init() {
  echo "· Checking the VPS ($VPS_SSH)"
  remote 'docker --version && docker compose version' || { echo "✗ SSH or Docker not available on the VPS" >&2; exit 1; }
  remote "mkdir -p '$VPS_DIR/data' '$VPS_DIR/media/img' '$VPS_DIR/media/gif' '$VPS_DIR/backups'"
  if remote "test -f '$VPS_DIR/.env'"; then
    echo "· $VPS_DIR/.env already exists — left as it is"
  else
    remote "cat > '$VPS_DIR/.env' && chmod 600 '$VPS_DIR/.env'" <<EOF
# SuperOpenGym on $DOMAIN — written by ./deploy.sh init. Every variable: .env.example in the repo.
RP_ID=$DOMAIN
ORIGIN=https://$DOMAIN
RP_NAME=SuperOpenGym
WEB_PORT=$WEB_PORT
WEB_BIND=127.0.0.1
DEFAULT_LANG=es
IMAGE_PREFIX=$IMAGE_PREFIX
IMAGE_TAG=latest
EOF
    echo "· $VPS_DIR/.env written"
  fi
  if [ -n "${GHCR_PULL_TOKEN:-}" ]; then
    echo "$GHCR_PULL_TOKEN" | remote "docker login ghcr.io -u '$GHCR_USER' --password-stdin" >/dev/null
    echo "· VPS logged in to ghcr.io (pull token)"
  else
    echo "! GHCR_PULL_TOKEN is empty: the VPS can only pull the images if they are public."
  fi
  echo
  echo "Install this server block in the VPS's Nginx (it is also in deploy/nginx-superopengym.conf):"
  echo "----------------------------------------------------------------------------"
  sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__WEB_PORT__/$WEB_PORT/g" deploy/nginx-superopengym.conf
  echo "----------------------------------------------------------------------------"
  echo "Then: sudo nginx -t && sudo systemctl reload nginx, and ./deploy.sh"
}

cmd_deploy() {
  local skip_tests=0 allow_dirty=0
  for a in "$@"; do
    case "$a" in
      --skip-tests) skip_tests=1 ;;
      --allow-dirty) allow_dirty=1 ;;
      *) echo "Unknown flag $a" >&2; exit 1 ;;
    esac
  done
  if [ "$allow_dirty" = 0 ] && [ -n "$(git status --porcelain)" ]; then
    echo "✗ Uncommitted changes — commit them (the image is tagged with the commit) or pass --allow-dirty." >&2
    exit 1
  fi
  local tag; tag="$(git rev-parse --short HEAD)"
  [ "$allow_dirty" = 1 ] && [ -n "$(git status --porcelain)" ] && tag="$tag-dirty"
  echo "· Deploying $(git rev-parse --abbrev-ref HEAD)@$tag to $DOMAIN"

  if [ "$skip_tests" = 0 ]; then
    echo "· Frontend tests"
    (cd frontend && npx vitest run)
  fi

  echo "· Building and pushing $IMAGE_PREFIX-{api,web}:$tag ($PLATFORM)"
  gh auth token | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
  local labels=(--label "org.opencontainers.image.source=https://github.com/X3M4/openGym"
                --label "org.opencontainers.image.revision=$tag")
  docker buildx build --platform "$PLATFORM" --target default "${labels[@]}" \
    -t "$IMAGE_PREFIX-api:$tag" -t "$IMAGE_PREFIX-api:latest" --push ./api
  # The Open Food Facts contact lives only in the untracked frontend/.env.local.
  local off_contact
  off_contact=$(sed -n 's/^VITE_OFF_CONTACT=//p' frontend/.env.local 2>/dev/null | tail -n 1)
  docker buildx build --platform "$PLATFORM" -f web/Dockerfile --build-arg "APP_BUILD=$tag" \
    --build-arg "VITE_OFF_CONTACT=$off_contact" "${labels[@]}" \
    -t "$IMAGE_PREFIX-web:$tag" -t "$IMAGE_PREFIX-web:latest" --push .

  echo "· Backing up $VPS_DIR/data on the VPS"
  remote "cd '$VPS_DIR' && tar czf backups/data-\$(date +%Y%m%d-%H%M%S)-before-$tag.tgz data \
    && ls -1t backups/data-*.tgz | tail -n +$((BACKUPS_KEEP + 1)) | xargs -r rm -f"

  echo "· Rolling the VPS to $tag"
  scp -q docker-compose.yml "$VPS_SSH:$VPS_DIR/docker-compose.yml"
  remote_env_set IMAGE_TAG "$tag"
  rcompose pull api web
  rcompose up -d --no-build --remove-orphans
  health
  echo "✓ SuperOpenGym $tag is live on https://$DOMAIN"
}

cmd_rollback() {
  local tag="${1:?usage: ./deploy.sh rollback <tag>}"
  remote_env_set IMAGE_TAG "$tag"
  rcompose pull api web
  rcompose up -d --no-build
  health
  echo "✓ Rolled back to $tag (data is not rolled back; backups are in $VPS_DIR/backups)"
}

case "${1:-deploy}" in
  init)     cmd_init ;;
  deploy)   shift || true; cmd_deploy "$@" ;;
  --*)      cmd_deploy "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  status)   rcompose ps; health || true ;;
  logs)     shift; rcompose logs -f --tail=200 "$@" ;;
  *) sed -n '2,16p' "$0"; exit 1 ;;
esac
