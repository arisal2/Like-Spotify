import { useEffect, useRef, useState } from "react";
import { encodeWav } from "../audio/wav";
import { WaveformTimeline } from "./WaveformTimeline";

export function SampleEditor({
	input,
	onSave,
	onClose,
	onReplace,
}: {
	input: { audio: Blob; name: string };
	onSave: (audio: Blob, name: string) => Promise<void>;
	onClose: () => void;
	onReplace: (file: File) => void;
}) {
	const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
	const [name, setName] = useState(input.name);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(0);
	const [gain, setGain] = useState(1);
	const [speed, setSpeed] = useState(1);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("Loading sample…");
	const [preview, setPreview] = useState("");
	const [original, setOriginal] = useState("");
	const [playhead, setPlayhead] = useState<number | null>(null);
	const player = useRef<HTMLAudioElement>(null);
	const editor = useRef<HTMLElement>(null);
	useEffect(() => {
		editor.current?.scrollIntoView({ block: "start" });
	}, [input]);
	useEffect(() => {
		const url = URL.createObjectURL(input.audio);
		setOriginal(url);
		return () => URL.revokeObjectURL(url);
	}, [input.audio]);
	useEffect(() => {
		let active = true;
		setBuffer(null);
		setPlayhead(null);
		const context = new AudioContext();
		void input.audio
			.arrayBuffer()
			.then((data) => context.decodeAudioData(data))
			.then((audio) => {
				if (audio.duration <= 0) throw new Error("Empty audio");
				if (active) {
					setBuffer(audio);
					setStart(0);
					setEnd(audio.duration);
					setName(input.name);
					setPreview("");
					setMessage("Set the start and end, then preview or save a copy.");
				}
			})
			.catch(() => {
				if (active) setMessage("Could not decode this sample in your browser.");
			})
			.finally(() => void context.close());
		return () => {
			active = false;
		};
	}, [input]);
	useEffect(
		() => () => {
			if (preview) URL.revokeObjectURL(preview);
		},
		[preview],
	);
	useEffect(() => {
		setPreview("");
		setPlayhead(null);
	}, [start, end, gain, speed]);
	async function render() {
		if (
			!buffer ||
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			start < 0 ||
			end > buffer.duration ||
			end <= start
		)
			throw new Error("Choose an end time after the start time.");
		const seconds = (end - start) / speed;
		const context = new OfflineAudioContext(
			buffer.numberOfChannels,
			Math.max(1, Math.ceil(seconds * buffer.sampleRate)),
			buffer.sampleRate,
		);
		const source = context.createBufferSource();
		const level = context.createGain();
		source.buffer = buffer;
		source.playbackRate.value = speed;
		level.gain.value = gain;
		source.connect(level).connect(context.destination);
		source.start(0, start, end - start);
		return encodeWav(await context.startRendering());
	}
	async function perform(save: boolean) {
		setBusy(true);
		try {
			const result = await render();
			if (save) {
				await onSave(result, name.trim() || "Edited sample");
				setMessage(
					"Saved a new copy to this album. The original is unchanged.",
				);
			} else {
				setPreview(URL.createObjectURL(result));
				setMessage("Preview ready. Use the player below to listen.");
			}
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Could not process this sample.",
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<section
			ref={editor}
			className="sample-section sample-editor"
			aria-labelledby="sample-editor-title"
			onDragOver={(event) => {
				if (event.dataTransfer.types.includes("Files")) event.preventDefault();
			}}
			onDrop={(event) => {
				if (!event.dataTransfer.types.includes("Files")) return;
				event.preventDefault();
				const file = event.dataTransfer.files[0];
				if (
					!file ||
					!file.type.startsWith("audio/") ||
					file.size === 0 ||
					file.size > 20 * 1024 * 1024
				) {
					setMessage("Drop an audio file up to 20 MB.");
					return;
				}
				onReplace(file);
			}}
		>
			<div className="sample-section-title">
				<div>
					<span className="eyebrow">SAMPLE EDITOR</span>
					<h2 id="sample-editor-title">Cut and shape your sound.</h2>
					<p>
						Drag the trim markers or drop another audio file here. Saving
						creates a new WAV.
					</p>
				</div>
				<div className="editor-header-actions">
					<label className="editor-open">
						Open audio
						<input
							type="file"
							accept="audio/*"
							onChange={(event) => {
								const file = event.currentTarget.files?.[0];
								if (
									file &&
									file.type.startsWith("audio/") &&
									file.size > 0 &&
									file.size <= 20 * 1024 * 1024
								)
									onReplace(file);
								else if (file) setMessage("Choose an audio file up to 20 MB.");
								event.currentTarget.value = "";
							}}
						/>
					</label>
					<button onClick={onClose}>Close editor</button>
				</div>
			</div>
			{buffer && (
				<WaveformTimeline
					buffer={buffer}
					start={start}
					end={end}
					playhead={playhead}
					onStart={setStart}
					onEnd={setEnd}
				/>
			)}
			{original && (
				<div className="editor-original">
					<span>Original sample</span>
					<audio
						controls
						src={original}
						aria-label="Original sample playback"
						onTimeUpdate={(event) =>
							setPlayhead(event.currentTarget.currentTime)
						}
						onEnded={() => setPlayhead(null)}
					/>
				</div>
			)}
			<div className="editor-controls">
				<label>
					Sample name
					<input
						value={name}
						maxLength={100}
						onChange={(event) => setName(event.target.value)}
					/>
				</label>
				<label>
					Level <output>{Math.round(gain * 100)}%</output>
					<input
						aria-label="Level"
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={gain}
						onChange={(event) => setGain(event.currentTarget.valueAsNumber)}
					/>
				</label>
				<label>
					Speed <output>{speed.toFixed(2)}×</output>
					<input
						aria-label="Speed"
						type="range"
						min="0.5"
						max="2"
						step="0.05"
						value={speed}
						onChange={(event) => setSpeed(event.currentTarget.valueAsNumber)}
					/>
				</label>
			</div>
			<details className="editor-precise">
				<summary>Precise trim</summary>
				<div className="editor-controls">
					<label>
						Start (seconds)
						<input
							type="number"
							min="0"
							max={buffer?.duration ?? 0}
							step="0.01"
							value={start}
							onChange={(event) => setStart(event.currentTarget.valueAsNumber)}
						/>
					</label>
					<label>
						End (seconds)
						<input
							type="number"
							min="0"
							max={buffer?.duration ?? 0}
							step="0.01"
							value={end}
							onChange={(event) => setEnd(event.currentTarget.valueAsNumber)}
						/>
					</label>
				</div>
			</details>
			<div className="sample-actions">
				<button disabled={!buffer || busy} onClick={() => void perform(false)}>
					Preview edit
				</button>
				<button disabled={!buffer || busy} onClick={() => void perform(true)}>
					Save edited copy
				</button>
			</div>
			{preview && (
				<audio
					ref={player}
					controls
					src={preview}
					aria-label="Edited sample preview"
					onTimeUpdate={(event) =>
						setPlayhead(start + event.currentTarget.currentTime * speed)
					}
					onEnded={() => setPlayhead(null)}
				/>
			)}
			<p role="status" className="sample-status">
				{message}
			</p>
		</section>
	);
}
