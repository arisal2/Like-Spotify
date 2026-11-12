#!/usr/bin/env bash
set -euo pipefail
selector="$(dirname "$0")/select-studio-tests.sh"
check() {
  local expected="$1" paths="$2" actual
  actual=$(printf '%s\n' "$paths" | bash "$selector")
  if [ "$actual" != "$expected" ]; then printf 'Selection mismatch for %s\nExpected: %s\nActual: %s\n' "$paths" "$expected" "$actual"; exit 1; fi
}
check $'browser_mode=studio\nbrowser_specs=e2e/synth.spec.ts' 'web/src/audio/synthEngine.ts'
check $'browser_mode=studio\nbrowser_specs=e2e/samples.spec.ts' 'web/src/audio/sampleMixer.ts'
check $'browser_mode=studio\nbrowser_specs=e2e/synth.spec.ts e2e/samples.spec.ts' $'web/e2e/synth.spec.ts\nweb/e2e/samples.spec.ts'
check $'browser_mode=studio\nbrowser_specs=e2e/synth.spec.ts e2e/samples.spec.ts e2e/sound-match.spec.ts e2e/theory.spec.ts' 'web/src/components/SampleStudio.tsx'
check $'browser_mode=studio\nbrowser_specs=e2e/sound-match.spec.ts' 'web/src/audio/soundMatch.ts'
check $'browser_mode=studio\nbrowser_specs=e2e/synth.spec.ts e2e/samples.spec.ts e2e/sound-match.spec.ts' 'web/src/components/SampleEditor.tsx'
check $'browser_mode=studio\nbrowser_specs=e2e/theory.spec.ts' 'web/src/audio/musicTheory.ts'
check $'browser_mode=full\nbrowser_specs=' 'web/src/main.tsx'
check $'browser_mode=full\nbrowser_specs=' 'backend/internal/httpapi/server.go'
check $'browser_mode=none\nbrowser_specs=' 'docs/architecture.md'
check $'browser_mode=none\nbrowser_specs=' 'scripts/select-delivery-images.sh'
check $'browser_mode=none\nbrowser_specs=' 'scripts/test-select-studio-tests.sh'
actual=$(printf '%s\n' 'docs/architecture.md' | FORCE_FULL_BROWSER=true bash "$selector")
[ "$actual" = $'browser_mode=full\nbrowser_specs=' ]
printf 'Studio test selection passed.\n'
