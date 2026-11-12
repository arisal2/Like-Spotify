#!/usr/bin/env bash
set -euo pipefail
selector="$(dirname "$0")/select-delivery-images.sh"
check() {
  local expected="$1" paths="$2" actual
  actual=$(printf '%s\n' "$paths" | bash "$selector")
  if [ "$actual" != "$expected" ]; then printf 'Image selection mismatch for %s\nExpected: %s\nActual: %s\n' "$paths" "$expected" "$actual"; exit 1; fi
}
check $'api=false\nweb=true' 'web/src/main.tsx'
check $'api=true\nweb=false' 'backend/cmd/server/main.go'
check $'api=true\nweb=true' $'backend/go.mod\nweb/package.json'
check $'api=true\nweb=true' '.dockerignore'
check $'api=false\nweb=false' $'scripts/select-studio-tests.sh\n.github/workflows/cd.yml\ndocs/github-actions.md'
actual=$(printf '%s\n' 'docs/github-actions.md' | DELIVERY_BOOTSTRAP=true bash "$selector")
[ "$actual" = $'api=true\nweb=true' ]
printf 'Delivery image selection passed.\n'
