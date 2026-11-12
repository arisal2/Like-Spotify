import { useEffect, useRef, useState } from "react";
import { SynthEngine } from "../audio/synthEngine";
import {
	defaultSynthPatch,
	readSynthPatch,
	synthStorageKey,
	type SynthPatch,
} from "../audio/synthPatch";
import { waveformSchema } from "../audio/patch";

const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
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

export function SynthStudio() {
	const [patch, setPatch] = useState(() => readSynthPatch(window.localStorage));
	const [status, setStatus] = useState("Play a key to start making sound.");
	const [active, setActive] = useState<number | null>(null);
	const engine = useRef<SynthEngine | null>(null);
	const patchRef = useRef(patch);
	patchRef.current = patch;
	const currentEngine = () => (engine.current ??= new SynthEngine());

	useEffect(() => {
		try {
			window.localStorage.setItem(synthStorageKey, JSON.stringify(patch));
			setStatus("Patch saved on this browser.");
		} catch {
			setStatus("Could not save this patch in your browser.");
		}
	}, [patch]);

	useEffect(() => {
		const down = (event: KeyboardEvent) => {
			if (
				event.repeat ||
				event.ctrlKey ||
				event.metaKey ||
				event.altKey ||
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLSelectElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement && event.target.isContentEditable)
			)
				return;
			const index = keys.indexOf(event.key.toLowerCase());
			if (index < 0) return;
			event.preventDefault();
			setActive(index);
			void currentEngine()
				.noteOn(60 + index, patchRef.current)
				.catch(() => setStatus("Audio could not start. Try another key."));
		};
		const up = (event: KeyboardEvent) => {
			const index = keys.indexOf(event.key.toLowerCase());
			if (index < 0) return;
			engine.current?.noteOff(60 + index, patchRef.current.release);
			setActive((value) => (value === index ? null : value));
		};
		const stop = () => {
			engine.current?.dispose();
			engine.current = null;
			setActive(null);
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("blur", stop);
		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			window.removeEventListener("blur", stop);
			engine.current?.dispose();
			engine.current = null;
		};
	}, []);

	const update = <K extends keyof SynthPatch>(key: K, value: SynthPatch[K]) =>
		setPatch((old) => ({ ...old, [key]: value }));
	return (
		<section className="sound-lab" aria-labelledby="synth-title">
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
			<div className="sound-lab-grid">
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
								update("waveform", waveformSchema.parse(event.target.value))
							}
						>
							{waveformSchema.options.map((wave) => (
								<option key={wave} value={wave}>
									{wave}
								</option>
							))}
						</select>
					</label>
					{(
						[
							["cutoff", "Filter cutoff", 100, 10000, 100, "Hz"],
							["attack", "Attack", 0.01, 1, 0.01, "s"],
							["release", "Release", 0.03, 2, 0.01, "s"],
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
					<p className="sound-status" role="status">
						{status}
					</p>
				</div>
				<div className="sound-output">
					<span className="eyebrow">KEYBOARD · C4 TO B4</span>
					<h2>Play a note</h2>
					<p>
						Use your mouse, touch, or the letters shown below. Lower the cutoff
						for a darker sound.
					</p>
					<div className="synth-keys" aria-label="Piano keyboard">
						{keys.map((key, index) => (
							<button
								key={key}
								className={`synth-key ${[1, 3, 6, 8, 10].includes(index) ? "sharp" : ""} ${active === index ? "pressed" : ""}`}
								aria-label={`${names[index]} 4, keyboard ${key.toUpperCase()}`}
								aria-pressed={active === index}
								onPointerDown={(event) => {
									event.currentTarget.setPointerCapture(event.pointerId);
									setActive(index);
									void currentEngine()
										.noteOn(60 + index, patch)
										.catch(() =>
											setStatus("Audio could not start. Try another key."),
										);
								}}
								onPointerUp={() => {
									engine.current?.noteOff(60 + index, patch.release);
									setActive(null);
								}}
								onPointerCancel={() => {
									engine.current?.noteOff(60 + index, patch.release);
									setActive(null);
								}}
								onKeyDown={(event) => {
									if (
										(event.key === " " || event.key === "Enter") &&
										!event.repeat
									) {
										event.preventDefault();
										setActive(index);
										void currentEngine()
											.noteOn(60 + index, patch)
											.catch(() =>
												setStatus("Audio could not start. Try another key."),
											);
									}
								}}
								onKeyUp={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										engine.current?.noteOff(60 + index, patch.release);
										setActive(null);
									}
								}}
							>
								<span>{names[index]}</span>
								<small>{key.toUpperCase()}</small>
							</button>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
