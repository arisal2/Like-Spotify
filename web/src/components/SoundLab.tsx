import { Download, Gamepad2, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { previewPatch, renderPatch } from "../audio/engine";
import {
  retroCoinPatch,
  soundPatchSchema,
  waveformSchema,
  type SoundPatch,
} from "../audio/patch";
import { encodeWav } from "../audio/wav";

export function SoundLab() {
  const [patch, setPatch] = useState<SoundPatch>(retroCoinPatch);
  const [status, setStatus] = useState("Ready to make some noise.");
  const [busy, setBusy] = useState(false);
  const validation = soundPatchSchema.safeParse(patch);

  const update = <Key extends keyof SoundPatch>(
    key: Key,
    value: SoundPatch[Key],
  ) => setPatch((current) => ({ ...current, [key]: value }));

  const run = async (work: () => Promise<void>, success: string) => {
    if (!validation.success || busy) return;
    setBusy(true);
    try {
      await work();
      setStatus(success);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Audio engine failed");
    } finally {
      setBusy(false);
    }
  };

  const exportWav = () =>
    run(async () => {
      const rendered = await renderPatch(patch);
      const url = URL.createObjectURL(encodeWav(rendered));
      const link = document.createElement("a");
      link.href = url;
      link.download = `retro-coin-seed-${patch.seed}.wav`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "Rendered a deterministic 44.1 kHz WAV.");

  return (
    <section className="sound-lab" aria-labelledby="sound-lab-title">
      <header className="sound-lab-hero">
        <div>
          <span className="eyebrow">FIRST PROTOTYPE · GAME SOUND LAB</span>
          <h1 id="sound-lab-title">Shape a sound. Ship a moment.</h1>
          <p>
            Start with a retro coin, bend its pitch and envelope, then export
            the exact sound as a WAV.
          </p>
        </div>
        <div className="sound-badge" aria-hidden="true">
          <Gamepad2 size={32} />
          <span>PATCH 01</span>
        </div>
      </header>

      <div className="sound-lab-grid">
        <div className="sound-controls">
          <div className="sound-panel-heading">
            <div>
              <span className="eyebrow">PRESET</span>
              <h2>Retro coin</h2>
            </div>
            <button
              className="text-button"
              onClick={() => setPatch(retroCoinPatch)}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          <label className="sound-field">
            <span>Waveform</span>
            <select
              value={patch.waveform}
              onChange={(event) =>
                update("waveform", waveformSchema.parse(event.target.value))
              }
            >
              {waveformSchema.options.map((waveform) => (
                <option key={waveform} value={waveform}>
                  {waveform}
                </option>
              ))}
            </select>
          </label>
          <Slider
            label="Start pitch"
            value={patch.startFrequency}
            min={40}
            max={2000}
            step={10}
            unit="Hz"
            onChange={(value) => update("startFrequency", value)}
          />
          <Slider
            label="End pitch"
            value={patch.endFrequency}
            min={40}
            max={4000}
            step={10}
            unit="Hz"
            onChange={(value) => update("endFrequency", value)}
          />
          <Slider
            label="Duration"
            value={patch.duration}
            min={0.05}
            max={2}
            step={0.01}
            unit="s"
            onChange={(value) => update("duration", value)}
          />
          <Slider
            label="Attack"
            value={patch.attack}
            min={0.001}
            max={0.5}
            step={0.001}
            unit="s"
            onChange={(value) => update("attack", value)}
          />
          <Slider
            label="Release"
            value={patch.release}
            min={0.001}
            max={1}
            step={0.001}
            unit="s"
            onChange={(value) => update("release", value)}
          />
        </div>

        <aside className="sound-output">
          <span className="eyebrow">OUTPUT</span>
          <div className="sound-visual" aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => (
              <i
                key={index}
                style={{
                  height: `${18 + ((index * patch.seed) % 73)}%`,
                }}
              />
            ))}
          </div>
          <dl className="sound-metadata">
            <div>
              <dt>Seed</dt>
              <dd>{patch.seed}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>Mono · 44.1 kHz · PCM 16</dd>
            </div>
            <div>
              <dt>Patch schema</dt>
              <dd>Version {patch.version}</dd>
            </div>
          </dl>
          {!validation.success && (
            <p className="form-error" role="alert">
              {validation.error.issues[0]?.message}
            </p>
          )}
          <div className="sound-actions">
            <button
              className="button"
              disabled={!validation.success || busy}
              onClick={() =>
                void run(
                  () => previewPatch(patch),
                  "Previewed from the live audio engine.",
                )
              }
            >
              <Play size={17} fill="currentColor" /> Preview
            </button>
            <button
              className="button secondary"
              disabled={!validation.success || busy}
              onClick={exportWav}
            >
              <Download size={17} /> Export WAV
            </button>
          </div>
          <p className="sound-status" role="status">
            {busy ? "Rendering…" : status}
          </p>
        </aside>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="sound-field">
      <span>
        {label} <output>{`${value} ${unit}`}</output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  );
}
