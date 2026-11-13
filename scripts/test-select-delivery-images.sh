#!/usr/bin/env bash
set -euo pipefail
selector="$(dirname "$0")/select-delivery-images.sh"
check() {
  local expected="$1" paths="$2" actual
  actual=$(printf '%s\n' "$paths" | bash "$selector")
  [ "$actual" = "$expected" ] || { printf 'Image selection mismatch: %s\n' "$paths"; exit 1; }
}
check 'web=true' 'web/src/main.tsx'
check 'web=true' '.dockerignore'
check 'web=false' $'scripts/select-studio-tests.sh\n.github/workflows/cd.yml\ndocs/github-actions.md'
actual=$(printf '%s\n' 'docs/github-actions.md' | DELIVERY_BOOTSTRAP=true bash "$selector")
[ "$actual" = 'web=true' ]
printf 'Delivery image selection passed.\n'
