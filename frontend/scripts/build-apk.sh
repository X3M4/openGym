#!/usr/bin/env bash
# Builds the signed SuperOpenGym APK on this machine — the local twin of the `build:apk` job in
# .gitlab-ci.yml: mobile build + `cap sync`, `assembleRelease`, then zipalign + apksigner.
#
#   frontend/scripts/build-apk.sh            → out-apk/SuperOpenGym-<version>.apk + .sha256
#
# The key never lives in the repo. By default it is read from ~/.android-keys/:
#   superopengym-release.jks    the keystore (alias: superopengym)
#   superopengym-release.pass   its password, one line, mode 600
# Override with KEYSTORE, KEYSTORE_PASS_FILE and KEY_ALIAS. KEEP THAT KEYSTORE: an update must be
# signed with the same key or Android refuses to install it over the app. The keystore is PKCS12,
# where the key's password is the store's, so no --key-pass (apksigner would read a second line
# of the same file for it).
set -euo pipefail

FRONTEND="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(dirname "$FRONTEND")"
OUT="$ROOT/out-apk"
KEYSTORE="${KEYSTORE:-$HOME/.android-keys/superopengym-release.jks}"
KEYSTORE_PASS_FILE="${KEYSTORE_PASS_FILE:-$HOME/.android-keys/superopengym-release.pass}"
KEY_ALIAS="${KEY_ALIAS:-superopengym}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

for f in "$KEYSTORE" "$KEYSTORE_PASS_FILE"; do
  [ -f "$f" ] || { echo "Missing $f — see the header of this script." >&2; exit 1; }
done
command -v java >/dev/null || { echo "Java 21 is required (JAVA_HOME / PATH)." >&2; exit 1; }

cd "$FRONTEND"
npm run build:mobile
VER="$(node -p "require('./package.json').version")"

cd android
./gradlew --no-daemon assembleRelease
UNSIGNED=app/build/outputs/apk/release/app-release-unsigned.apk
BT="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"

mkdir -p "$OUT"
APK="$OUT/SuperOpenGym-$VER.apk"
"$BT/zipalign" -f -p 4 "$UNSIGNED" "$OUT/aligned.apk"
"$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass "file:$KEYSTORE_PASS_FILE" \
  --ks-key-alias "$KEY_ALIAS" \
  --out "$APK" "$OUT/aligned.apk"
rm -f "$OUT/aligned.apk"
"$BT/apksigner" verify --print-certs "$APK"

# The in-app updater refuses an APK without its checksum beside it in the release.
(cd "$OUT" && sha256sum "$(basename "$APK")" > "$(basename "$APK").sha256" && cat "$(basename "$APK").sha256")
