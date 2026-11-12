import { useEffect, useRef, useState } from "react";
import {
	analyzeSound,
	playSoundMatch,
	type SoundMatch,
} from "../audio/soundMatch";

export function SoundMatcher({
	onSave,
	onEdit,
}: {
	onSave: (recording: Blob) => Promise<void>;
	onEdit: (recording: Blob) => void;
}) {
	const [recording, setRecording] = useState<Blob | null>(null);
	const [url, setUrl] = useState("");
	const [match, setMatch] = useState<SoundMatch | null>(null);
	const [recordingNow, setRecordingNow] = useState(false);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState(
		"Record a short tap, knock, or note to get started.",
	);
	const recorder = useRef<MediaRecorder | null>(null);
	const stream = useRef<MediaStream | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			if (timer.current) clearTimeout(timer.current);
			if (recorder.current?.state === "recording") recorder.current.stop();
			stream.current?.getTracks().forEach((track) => {
				track.stop();
			});
		};
	}, []);
	useEffect(() => {
		if (!recording) {
			setUrl("");
			return;
		}
		const next = URL.createObjectURL(recording);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [recording]);

	async function start() {
		if (
			!navigator.mediaDevices?.getUserMedia ||
			typeof MediaRecorder === "undefined"
		) {
			setMessage("Microphone recording is not supported in this browser.");
			return;
		}
		setBusy(true);
		try {
			const input = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
			});
			if (!mounted.current) {
				input.getTracks().forEach((track) => {
					track.stop();
				});
				return;
			}
			stream.current = input;
			const next = new MediaRecorder(input);
			const chunks: BlobPart[] = [];
			recorder.current = next;
			next.ondataavailable = (event) => {
				if (event.data.size) chunks.push(event.data);
			};
			next.onstop = () => {
				input.getTracks().forEach((track) => {
					track.stop();
				});
				if (stream.current === input) stream.current = null;
				if (!mounted.current) return;
				setRecordingNow(false);
				const blob = new Blob(chunks, { type: next.mimeType || "audio/webm" });
				if (blob.size) {
					setRecording(blob);
					onEdit(blob);
					setMatch(null);
					setMessage(
						"Recording ready. Listen, then create a synthesized approximation.",
					);
				} else setMessage("No sound was captured. Try recording again.");
			};
			next.start();
			setRecordingNow(true);
			setMessage("Recording for up to 5 seconds. Make your sound now.");
			timer.current = setTimeout(() => {
				if (next.state === "recording") next.stop();
			}, 5000);
		} catch {
			stream.current?.getTracks().forEach((track) => {
				track.stop();
			});
			stream.current = null;
			if (mounted.current)
				setMessage(
					"Microphone unavailable or permission denied. Allow microphone access and try again.",
				);
		} finally {
			if (mounted.current) setBusy(false);
		}
	}
	function stop() {
		if (timer.current) clearTimeout(timer.current);
		if (recorder.current?.state === "recording") recorder.current.stop();
	}
	async function analyze() {
		if (!recording) return;
		setBusy(true);
		let context: AudioContext | undefined;
		try {
			context = new AudioContext();
			const audio = await context.decodeAudioData(
				await recording.arrayBuffer(),
			);
			const result = analyzeSound(audio.getChannelData(0), audio.sampleRate);
			setMatch(result);
			setMessage(
				"Approximation ready. Compare it with the original; short noisy impacts may sound different.",
			);
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Could not analyze this recording.",
			);
		} finally {
			if (context && context.state !== "closed") await context.close();
			if (mounted.current) setBusy(false);
		}
	}
	return (
		<section
			className="sample-section sound-matcher"
			aria-labelledby="match-title"
		>
			<span className="eyebrow">SOUND MATCH · EXPERIMENTAL</span>
			<h2 id="match-title">Turn a sound into an idea.</h2>
			<p>
				Record a table tap or another short sound. Listen to the original, then
				hear a synthesized approximation of its strongest frequencies.
			</p>
			<div className="sample-actions">
				<button onClick={() => void start()} disabled={busy || recordingNow}>
					{recordingNow ? "Recording…" : "● Record sound"}
				</button>
				<button onClick={stop} disabled={!recordingNow}>
					■ Stop recording
				</button>
			</div>
			{url && (
				<div className="match-results">
					<audio controls src={url} aria-label="Original recording" />
					<div className="sample-actions">
						<button
							disabled={busy || recordingNow}
							onClick={() => void analyze()}
						>
							Analyze sound
						</button>
						<button
							disabled={!match || busy || recordingNow}
							onClick={() => {
								if (!match) return;
								setBusy(true);
								void playSoundMatch(match)
									.catch(() => setMessage("Could not play the approximation."))
									.finally(() => {
										if (mounted.current) setBusy(false);
									});
							}}
						>
							▶ Play approximation
						</button>
						<button
							disabled={busy || recordingNow}
							onClick={() => {
								if (!recording) return;
								setBusy(true);
								void onSave(recording)
									.then(() => setMessage("Recording added to this album."))
									.catch(() =>
										setMessage(
											"Could not save the recording. Browser storage may be full.",
										),
									)
									.finally(() => {
										if (mounted.current) setBusy(false);
									});
							}}
						>
							Add original to album
						</button>
					</div>
				</div>
			)}
			<p className="sample-status" role="status">
				{message} Audio stays in this browser.
			</p>
		</section>
	);
}
