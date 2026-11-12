import { useEffect, useRef, useState } from "react";
import { encodeWav } from "../audio/wav";

export function SampleEditor({
	input,
	onSave,
	onClose,
}: {
	input: { audio: Blob; name: string };
	onSave: (audio: Blob, name: string) => Promise<void>;
	onClose: () => void;
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
		const context = new AudioContext();
		void input.audio
			.arrayBuffer()
			.then((data) => context.decodeAudioData(data))
			.then((audio) => {
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
		>
			<div className="sample-section-title">
				<div>
					<span className="eyebrow">SAMPLE EDITOR</span>
					<h2 id="sample-editor-title">Cut and shape your sound.</h2>
					<p>Edits create a new WAV; your original remains untouched.</p>
				</div>
				<button onClick={onClose}>Close editor</button>
			</div>
			{original && (
				<div className="editor-original">
					<span>Original sample</span>
					<audio
						controls
						src={original}
						aria-label="Original sample playback"
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
				/>
			)}
			<p role="status" className="sample-status">
				{message}
			</p>
		</section>
	);
}
