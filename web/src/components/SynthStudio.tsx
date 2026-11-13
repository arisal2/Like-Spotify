import { useEffect, useState } from "react";
import { renderSynthSample, renderSynthPhrase } from "../audio/synthEngine";
import {
	synthKeys as keys,
	useSynthPerformance,
} from "../hooks/useSynthPerformance";
import {
	defaultSynthPatch,
	readSynthPatch,
	synthStorageKey,
	synthWaveformSchema,
	type SynthPatch,
} from "../audio/synthPatch";

const names = [
	"C",
	"C sharp",
	"D",
	"D sharp",
	"E",
	"F",
	"F sharp",
	"G",
	"G sharp",
	"A",
	"A sharp",
	"B",
];

export function SynthStudio({
	onSendToEditor,
}: {
	onSendToEditor?: (audio: Blob, name: string) => void;
}) {
	const [patch, setPatch] = useState(() => readSynthPatch(window.localStorage));
	const [sampleNote, setSampleNote] = useState(60);
	const {
		active,
		recording,
		take,
		status,
		setStatus,
		startNote,
		endNote,
		startRecording,
		stopRecording,
	} = useSynthPerformance(patch, setSampleNote);
	const [sampleDuration, setSampleDuration] = useState(1);
	const [rendering, setRendering] = useState(false);

	useEffect(() => {
		try {
			window.localStorage.setItem(synthStorageKey, JSON.stringify(patch));
			setStatus("Patch saved on this browser.");
		} catch {
			setStatus("Could not save this patch in your browser.");
		}
	}, [patch]);

	const update = <K extends keyof SynthPatch>(key: K, value: SynthPatch[K]) =>
		setPatch((old) => ({ ...old, [key]: value }));
	return (
		<section className="sound-lab synth-studio" aria-labelledby="synth-title">
			<header className="sound-lab-hero">
				<div>
					<span className="eyebrow">STUDIO · PLAYABLE SYNTH</span>
					<h1 id="synth-title">Make your first sound.</h1>
					<p>
						Play the keys, shape the tone, and find something unexpected. Your
						patch saves on this browser.
					</p>
				</div>
			</header>
			<div className="sound-output synth-keyboard-panel">
				<span className="eyebrow">KEYBOARD · C4 TO B4</span>
				<h2>Play a note</h2>
				<p>
					Use your mouse, touch, or the letters shown below. Lower the cutoff
					for a darker sound.
				</p>
				{onSendToEditor && (
					<div className="synth-sample-actions">
						<label>
							Note to sample
							<select
								aria-label="Note to sample"
								value={sampleNote}
								onChange={(event) => setSampleNote(Number(event.target.value))}
							>
								{names.map((name, index) => (
									<option key={name} value={60 + index}>
										{name} 4
									</option>
								))}
							</select>
						</label>
						<label>
							Note length (seconds)
							<input
								type="number"
								min="0.1"
								max="5"
								step="0.1"
								value={sampleDuration}
								onChange={(event) =>
									setSampleDuration(event.currentTarget.valueAsNumber)
								}
							/>
						</label>
						<button
							disabled={rendering || recording}
							onClick={() => {
								setRendering(true);
								void renderSynthSample(sampleNote, patch, sampleDuration)
									.then((audio) =>
										onSendToEditor(audio, `Synth ${names[sampleNote - 60]} 4`),
									)
									.catch((error) =>
										setStatus(
											error instanceof Error
												? error.message
												: "Could not render the synth sample.",
										),
									)
									.finally(() => setRendering(false));
							}}
						>
							{rendering ? "Creating sample…" : "Add to sample editor"}
						</button>
					</div>
				)}
				<div className="synth-keys" aria-label="Piano keyboard">
					{keys.map((key, index) => (
						<button
							key={key}
							className={`synth-key ${[1, 3, 6, 8, 10].includes(index) ? "sharp" : ""} ${active.includes(index) ? "pressed" : ""}`}
							aria-label={`${names[index]} 4, keyboard ${key.toUpperCase()}`}
							aria-pressed={active.includes(index)}
							onPointerDown={(event) => {
								event.currentTarget.setPointerCapture(event.pointerId);
								setSampleNote(60 + index);
								startNote(index, `pointer:${event.pointerId}`);
							}}
							onPointerUp={(event) =>
								endNote(index, `pointer:${event.pointerId}`)
							}
							onPointerCancel={(event) =>
								endNote(index, `pointer:${event.pointerId}`)
							}
							onLostPointerCapture={(event) =>
								endNote(index, `pointer:${event.pointerId}`)
							}
							onKeyDown={(event) => {
								if (
									(event.key === " " || event.key === "Enter") &&
									!event.repeat
								) {
									event.preventDefault();
									setSampleNote(60 + index);
									startNote(index, `button:${event.key}`);
								}
							}}
							onKeyUp={(event) => {
								if (event.key === " " || event.key === "Enter") {
									event.preventDefault();
									endNote(index, `button:${event.key}`);
								}
							}}
							onBlur={() => {
								endNote(index, "button: ");
								endNote(index, "button:Enter");
							}}
						>
							<span>{names[index]}</span>
							<small>{key.toUpperCase()}</small>
						</button>
					))}
				</div>
				{onSendToEditor && (
					<div className="synth-phrase">
						<h3>Record a phrase</h3>
						<p>
							Capture the notes and chords you play, up to 30 seconds. Add the
							take to the editor, then save it as a separate sample. The note
							selector above exports just one note.
						</p>
						<div className="synth-sample-actions">
							<button
								disabled={recording || rendering}
								onClick={startRecording}
							>
								Record phrase
							</button>
							<button disabled={!recording} onClick={stopRecording}>
								Stop phrase
							</button>
							<button
								disabled={recording || rendering || !take.length}
								onClick={() => {
									setRendering(true);
									void renderSynthPhrase(take)
										.then((audio) =>
											onSendToEditor(
												audio,
												`Synth phrase ${new Date().toLocaleTimeString()}`,
											),
										)
										.catch((error) =>
											setStatus(
												error instanceof Error
													? error.message
													: "Could not render the phrase.",
											),
										)
										.finally(() => setRendering(false));
								}}
							>
								Add phrase to editor
							</button>
						</div>
					</div>
				)}
				<p className="sound-status" role="status">
					{status}
				</p>
			</div>
			<div className="synth-layout">
				<div className="sound-controls">
					<div className="sound-panel-heading">
						<div>
							<span className="eyebrow">YOUR PATCH</span>
							<h2>Shape the sound</h2>
						</div>
						<button
							className="text-button"
							onClick={() => setPatch({ ...defaultSynthPatch })}
						>
							Reset
						</button>
					</div>
					<label className="sound-field">
						<span>Waveform</span>
						<select
							value={patch.waveform}
							onChange={(event) =>
								update(
									"waveform",
									synthWaveformSchema.parse(event.target.value),
								)
							}
						>
							{synthWaveformSchema.options.map((wave) => (
								<option key={wave} value={wave}>
									{wave}
								</option>
							))}
						</select>
					</label>
					<label className="sound-field">
						<span>Second oscillator waveform</span>
						<select
							aria-label="Second oscillator waveform"
							value={patch.waveform2}
							onChange={(event) =>
								update(
									"waveform2",
									synthWaveformSchema.parse(event.target.value),
								)
							}
						>
							{synthWaveformSchema.options.map((wave) => (
								<option key={wave} value={wave}>
									{wave}
								</option>
							))}
						</select>
					</label>
					<p className="synth-explainer">
						Blend two waves. Detune shifts oscillator 2 in cents; 1,200 cents is
						one octave. Select “harmonics” to shape the second and third
						overtones.
					</p>
					<details className="synth-math">
						<summary>Show the maths</summary>
						<p>Pitch: f = 440 × 2^((MIDI note − 69) / 12) Hz</p>
						<p>
							Harmonic wave: sin(ωt) + H₂ sin(2ωt) + H₃ sin(3ωt), normalized.
						</p>
						<p>
							Envelope: attack → decay → sustain, followed by release when you
							let go.
						</p>
						<p>
							Filter movement: cutoff + depth × sin(2π × LFO rate × t). Drive
							uses a soft tanh curve.
						</p>
						<p>Control changes affect the next note you play.</p>
					</details>
					{(
						[
							["oscMix", "Oscillator 2 mix", 0, 1, 0.01, ""],
							["detune", "Oscillator 2 detune", -1200, 1200, 1, "cents"],
							["harmonic2", "Second harmonic", 0, 1, 0.01, ""],
							["harmonic3", "Third harmonic", 0, 1, 0.01, ""],
							["cutoff", "Filter cutoff", 100, 10000, 100, "Hz"],
							["resonance", "Filter resonance", 0, 12, 0.1, "Q"],
							["attack", "Attack", 0.01, 1, 0.01, "s"],
							["decay", "Decay", 0.01, 2, 0.01, "s"],
							["sustain", "Sustain", 0, 1, 0.01, ""],
							["release", "Release", 0.03, 2, 0.01, "s"],
							["lfoRate", "Filter LFO rate", 0.1, 20, 0.1, "Hz"],
							["lfoDepth", "Filter LFO depth", 0, 1, 0.01, ""],
							["drive", "Distortion drive", 0, 1, 0.01, ""],
							["volume", "Volume", 0, 0.25, 0.01, ""],
						] as const
					).map(([key, label, min, max, step, unit]) => (
						<label className="sound-field" key={key}>
							<span>
								{label}{" "}
								<output>
									{patch[key]} {unit}
								</output>
							</span>
							<input
								type="range"
								aria-label={label}
								min={min}
								max={max}
								step={step}
								value={patch[key]}
								onChange={(event) =>
									update(key, event.currentTarget.valueAsNumber)
								}
							/>
						</label>
					))}
				</div>
			</div>
		</section>
	);
}
