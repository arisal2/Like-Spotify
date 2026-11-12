import { useEffect, useMemo, useRef, useState } from "react";
import {
	buildChords,
	buildScale,
	theoryKeys,
	type ScaleMode,
	type TheoryKey,
} from "../audio/musicTheory";
import { TheoryPlayer } from "../audio/theoryPlayer";
import "./theoryStudio.css";

export function TheoryStudio() {
	const [key, setKey] = useState<TheoryKey>("C");
	const [mode, setMode] = useState<ScaleMode>("major");
	const [status, setStatus] = useState(
		"Choose a key, then play a scale or chord.",
	);
	const player = useRef<TheoryPlayer | null>(null);
	const scale = useMemo(() => buildScale(key, mode), [key, mode]);
	const chords = useMemo(() => buildChords(scale), [scale]);
	useEffect(
		() => () => {
			player.current?.dispose();
			player.current = null;
		},
		[],
	);
	function play(notes: number[], sequence = false) {
		player.current ??= new TheoryPlayer();
		void player.current
			.play(notes, sequence)
			.catch(() => setStatus("Audio could not start. Try playing again."));
	}
	return (
		<section className="theory-studio" aria-labelledby="theory-title">
			<header className="sound-lab-hero">
				<div>
					<span className="eyebrow">MUSIC THEORY · LEARN BY EAR</span>
					<h1 id="theory-title">Hear how music fits together.</h1>
					<p>
						Choose a key, hear its scale, and explore chords built from the same
						seven notes.
					</p>
				</div>
			</header>
			<div className="theory-controls">
				<label>
					Key
					<select
						aria-label="Key"
						value={key}
						onChange={(event) => {
							const value = event.target.value;
							if (theoryKeys.some((option) => option === value))
								setKey(value as TheoryKey);
						}}
					>
						{theoryKeys.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
				<label>
					Scale
					<select
						aria-label="Scale"
						value={mode}
						onChange={(event) =>
							setMode(event.target.value === "minor" ? "minor" : "major")
						}
					>
						<option value="major">Major</option>
						<option value="minor">Natural minor</option>
					</select>
				</label>
				<button
					className="theory-primary"
					onClick={() => {
						play([...scale.map((note) => note.midi), scale[0].midi + 12], true);
						setStatus(`Playing the ${key} ${mode} scale, one note at a time.`);
					}}
				>
					▶ Hear scale
				</button>
			</div>
			<section className="theory-panel">
				<span className="eyebrow">THE SCALE</span>
				<h2>
					{key} {mode === "major" ? "major" : "natural minor"}
				</h2>
				<p>
					A scale is a set of notes. Click each one to hear it; the numbers are
					its scale degrees.
				</p>
				<div className="theory-notes">
					{scale.map((note) => (
						<button
							key={note.degree}
							aria-label={`Play ${note.name}, degree ${note.degree}`}
							onClick={() => {
								play([note.midi]);
								setStatus(`Playing ${note.name}, scale degree ${note.degree}.`);
							}}
						>
							<small>{note.degree}</small>
							<strong>{note.name}</strong>
							<span>▶</span>
						</button>
					))}
				</div>
				<p className="theory-hint">
					{mode === "major"
						? "Major steps: whole · whole · half · whole · whole · whole · half"
						: "Natural minor steps: whole · half · whole · whole · half · whole · whole"}
				</p>
			</section>
			<section className="theory-panel">
				<span className="eyebrow">CHORDS IN THIS KEY</span>
				<h2>Stack notes into chords.</h2>
				<p>
					Each triad uses a root, the note two scale steps above it, and the
					note two steps after that. Click a chord to hear all three together.
				</p>
				<div className="theory-chords">
					{chords.map((chord) => (
						<button
							key={chord.roman}
							aria-label={`Play ${chord.name} chord, ${chord.roman}`}
							onClick={() => {
								play(chord.notes.map((note) => note.midi));
								setStatus(
									`Playing ${chord.name}: ${chord.notes.map((note) => note.name).join(", ")}.`,
								);
							}}
						>
							<small>{chord.roman}</small>
							<strong>{chord.name}</strong>
							<span>{chord.notes.map((note) => note.name).join(" · ")}</span>
						</button>
					))}
				</div>
				<p className="theory-hint">
					Uppercase numerals are major chords, lowercase are minor, and ° means
					diminished. These are starting points—not rules.
				</p>
			</section>
			<p role="status" className="sample-status">
				{status}
			</p>
		</section>
	);
}
