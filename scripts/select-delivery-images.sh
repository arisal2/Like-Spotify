#!/usr/bin/env bash
set -euo pipefail
# Only frontend image inputs require a new image. Other changes reuse its SHA tag.
web=false
if [ "${DELIVERY_BOOTSTRAP:-false}" = true ]; then web=true; fi
while IFS= read -r path; do
  case "$path" in web/*|.dockerignore) web=true ;; esac
done
printf 'web=%s\n' "$web"
