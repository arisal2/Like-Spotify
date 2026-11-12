#!/usr/bin/env bash
set -euo pipefail

# Input: changed paths, one per line. Output: conservative Playwright selection.
full=false
synth=false
samples=false
sound_match=false
theory=false
while IFS= read -r path; do
  case "$path" in
    web/src/audio/synthEngine.ts|web/src/audio/synthEngine.test.ts|web/src/audio/synthPatch.ts|web/src/audio/synthPatch.test.ts|web/src/components/SynthStudio.tsx|web/e2e/synth.spec.ts)
      synth=true ;;
    web/src/components/SampleStudio.tsx|web/src/components/sampleStudio.css)
      synth=true; samples=true; sound_match=true; theory=true ;;
    web/src/components/SampleEditor.tsx)
      synth=true; samples=true; sound_match=true ;;
    web/src/audio/soundMatch.ts|web/src/audio/soundMatch.test.ts|web/src/components/SoundMatcher.tsx|web/e2e/sound-match.spec.ts)
      sound_match=true ;;
    web/src/audio/sampleMixer.ts|web/src/audio/sampleStore.ts|web/e2e/samples.spec.ts)
      samples=true ;;
    web/src/audio/musicTheory.ts|web/src/audio/musicTheory.test.ts|web/src/audio/theoryPlayer.ts|web/src/components/TheoryStudio.tsx|web/src/components/theoryStudio.css|web/e2e/theory.spec.ts)
      theory=true ;;
    scripts/select-studio-tests.sh|scripts/test-select-studio-tests.sh|scripts/select-delivery-images.sh|scripts/test-select-delivery-images.sh)
      ;;
    web/*|backend/*|.github/workflows/*|scripts/*|.dockerignore|compose.yaml|.env.example|.github/dependabot.yml)
      full=true ;;
  esac
done
if [ "${FORCE_FULL_BROWSER:-false}" = true ]; then full=true; fi
if [ "$full" = true ]; then
  printf 'browser_mode=full\nbrowser_specs=\n'
elif [ "$synth" = true ] || [ "$samples" = true ] || [ "$sound_match" = true ] || [ "$theory" = true ]; then
  specs=''
  if [ "$synth" = true ]; then specs='e2e/synth.spec.ts'; fi
  if [ "$samples" = true ]; then specs="${specs:+$specs }e2e/samples.spec.ts"; fi
  if [ "$sound_match" = true ]; then specs="${specs:+$specs }e2e/sound-match.spec.ts"; fi
  if [ "$theory" = true ]; then specs="${specs:+$specs }e2e/theory.spec.ts"; fi
  printf 'browser_mode=studio\nbrowser_specs=%s\n' "$specs"
else
  printf 'browser_mode=none\nbrowser_specs=\n'
fi
