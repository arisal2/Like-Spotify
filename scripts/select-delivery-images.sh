#!/usr/bin/env bash
set -euo pipefail

# Read changed paths on stdin. Bootstrap builds both components; otherwise
# only inputs copied by a Dockerfile or shared Docker build inputs matter.
api=false
web=false
if [ "${DELIVERY_BOOTSTRAP:-false}" = true ]; then api=true; web=true; fi
while IFS= read -r path; do
  case "$path" in
    backend/*) api=true ;;
    web/*) web=true ;;
    .dockerignore) api=true; web=true ;;
  esac
done
printf 'api=%s\nweb=%s\n' "$api" "$web"
