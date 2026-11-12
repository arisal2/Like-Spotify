#!/usr/bin/env bash
set -euo pipefail

# Input: changed paths, one per line. Output: conservative Playwright selection.
full=false
synth=false
samples=false
while IFS= read -r path; do
  case "$path" in
    web/src/audio/synthEngine.ts|web/src/audio/synthPatch.ts|web/src/audio/synthPatch.test.ts|web/src/components/SynthStudio.tsx|web/e2e/synth.spec.ts)
      synth=true ;;
    web/src/components/SampleStudio.tsx|web/src/components/sampleStudio.css)
      synth=true; samples=true ;;
    web/src/audio/sampleMixer.ts|web/src/audio/sampleStore.ts|web/e2e/samples.spec.ts)
      samples=true ;;
    web/*|backend/*|.github/workflows/*|scripts/*|.dockerignore|compose.yaml|.env.example|.github/dependabot.yml)
      full=true ;;
  esac
done
if [ "${FORCE_FULL_BROWSER:-false}" = true ]; then full=true; fi
if [ "$full" = true ]; then
  printf 'browser_mode=full\nbrowser_specs=\n'
elif [ "$synth" = true ] || [ "$samples" = true ]; then
  specs=''
  if [ "$synth" = true ]; then specs='e2e/synth.spec.ts'; fi
  if [ "$samples" = true ]; then specs="${specs:+$specs }e2e/samples.spec.ts"; fi
  printf 'browser_mode=studio\nbrowser_specs=%s\n' "$specs"
else
  printf 'browser_mode=none\nbrowser_specs=\n'
fi
