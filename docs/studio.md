# Studio guide

Bedlam-Like-Music runs synthesis, recording, and sample editing in your browser. Start the application using the [quick start](../README.md#get-started), then choose a workspace from the studio.

## Synthesizer

Open `/studio/synth`. Play the on-screen keyboard using a mouse, touch, or the indicated computer keys. Your browser starts audio after you interact with the page.

Each patch has two oscillators. Choose a waveform for each, blend and detune them, then shape the result with filter cutoff and resonance, an ADSR envelope, filter LFO, and distortion. The `harmonics` waveform lets you adjust the second and third harmonics. Open **Show the maths** for the relationships behind the controls. Changes affect the next note you play.

To turn a patch into editable audio, select a note and note length, then click **Add to sample editor**. The rendered WAV includes the patch's release tail and opens in the editor. This creates a single note, not a recorded performance or a sequenced track.

## Samples and albums

On the sample library page, choose **Add samples** to import audio files of up to 20 MB each. Create an album and add its first sample to persist it. Use each track's play, volume, pan, and mute controls, or **Play mix** to start all unmuted samples in the album together. Mixer settings take effect the next time playback starts.

Choose **Edit** on a library sample, or record a sound to open its copy in the editor. Listen to the original, set start and end times, adjust level and speed, then preview or save a new WAV copy. Saving does not overwrite the source. The current mixer does not provide a multitrack timeline, arrangement, or full-mix export.

## Record and match a sound

In **Sound Match**, click **Record sound**, grant microphone access, and make a short sound. Recording stops after five seconds or when you press **Stop recording**. Listen to the original, analyze it, and play an experimental synthesized approximation. Analysis uses prominent frequencies and decay; it is not an exact reconstruction, especially for noisy or percussive sounds. Add the original to an album or edit it as a new sample.

Microphone availability depends on browser permission and a secure context such as `localhost` or HTTPS. Recording and analysis stay in the browser.

## Music theory

Open `/studio/theory` or choose **Music theory** in the studio. Select a key and a major or natural minor scale. Play individual notes, hear the scale, or play its diatonic triads. The scale degrees, chord numerals, and note spellings are shown alongside short explanations.

## Storage and themes

Imported and recorded samples, album membership, and mixer settings use IndexedDB. Synth patches and the selected theme use browser local storage. They are specific to the browser and device; they do not synchronize with the Go API or MySQL. Browser data eviction or clearing site data can remove them. Keep source files separately.

Choose Moss, Cyberpunk, Retro, or Ocean from the theme selector. Only import or record audio you have permission to use.
