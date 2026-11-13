import {
	useEffect,
	useRef,
	type KeyboardEvent,
	type PointerEvent,
} from "react";

type Props = {
	buffer: AudioBuffer;
	start: number;
	end: number;
	playhead: number | null;
	onStart: (time: number) => void;
	onEnd: (time: number) => void;
};

export function WaveformTimeline({
	buffer,
	start,
	end,
	playhead,
	onStart,
	onEnd,
}: Props) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const track = useRef<HTMLDivElement>(null);
	const duration = buffer.duration;
	const gap = 1 / buffer.sampleRate;
	const safeStart = Number.isFinite(start)
		? Math.max(0, Math.min(duration, start))
		: 0;
	const safeEnd = Number.isFinite(end)
		? Math.max(0, Math.min(duration, end))
		: duration;
	const percent = (time: number) =>
		`${Math.max(0, Math.min(100, (time / duration) * 100))}%`;

	useEffect(() => {
		const element = canvas.current;
		if (!element) return;
		const draw = () => {
			const width = Math.max(1, Math.floor(element.clientWidth));
			const height = Math.max(1, Math.floor(element.clientHeight));
			const dpr = window.devicePixelRatio || 1;
			element.width = Math.floor(width * dpr);
			element.height = Math.floor(height * dpr);
			const ctx = element.getContext("2d");
			if (!ctx) return;
			ctx.scale(dpr, dpr);
			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = "#91a9a0";
			ctx.lineWidth = 1;
			ctx.beginPath();
			const channels = Array.from(
				{ length: buffer.numberOfChannels },
				(_, index) => buffer.getChannelData(index),
			);
			for (let x = 0; x < width; x += 2) {
				const from = Math.floor((x / width) * buffer.length);
				const to = Math.max(
					from + 1,
					Math.min(
						buffer.length,
						Math.floor(((x + 2) / width) * buffer.length),
					),
				);
				let peak = 0;
				for (const channel of channels)
					for (let i = from; i < to; i++)
						peak = Math.max(peak, Math.abs(channel[i]));
				const amplitude = Math.max(1, Math.min(1, peak) * (height / 2 - 4));
				ctx.moveTo(x + 0.5, height / 2 - amplitude);
				ctx.lineTo(x + 0.5, height / 2 + amplitude);
			}
			ctx.stroke();
		};
		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(element);
		return () => observer.disconnect();
	}, [buffer]);

	function setHandle(which: "start" | "end", time: number) {
		if (!Number.isFinite(time)) return;
		if (which === "start") onStart(Math.max(0, Math.min(safeEnd - gap, time)));
		else onEnd(Math.min(duration, Math.max(safeStart + gap, time)));
	}
	function point(
		which: "start" | "end",
		event: PointerEvent<HTMLButtonElement>,
	) {
		const rect = track.current?.getBoundingClientRect();
		if (!rect || rect.width <= 0) return;
		setHandle(which, ((event.clientX - rect.left) / rect.width) * duration);
	}
	function keyboard(
		which: "start" | "end",
		event: KeyboardEvent<HTMLButtonElement>,
	) {
		const current = which === "start" ? safeStart : safeEnd;
		const step = Math.max(gap, duration / 100);
		const values: Record<string, number> = {
			ArrowLeft: current - step,
			ArrowDown: current - step,
			ArrowRight: current + step,
			ArrowUp: current + step,
			PageDown: current - step * 10,
			PageUp: current + step * 10,
			Home: 0,
			End: duration,
		};
		if (!(event.key in values)) return;
		event.preventDefault();
		setHandle(which, values[event.key]);
	}
	return (
		<div className="waveform-workspace">
			<div className="waveform-ruler">
				<span>0:00</span>
				<span>{(duration / 2).toFixed(2)} s</span>
				<span>{duration.toFixed(2)} s</span>
			</div>
			<div
				className="waveform-track"
				ref={track}
				aria-label="Audio waveform timeline"
			>
				<canvas ref={canvas} aria-hidden="true" />
				<div
					className="waveform-excluded"
					style={{ left: 0, width: percent(safeStart) }}
				/>
				<div
					className="waveform-excluded"
					style={{ left: percent(safeEnd), right: 0 }}
				/>
				<div
					className="waveform-selection"
					style={{
						left: percent(safeStart),
						width: `${Math.max(0, ((safeEnd - safeStart) / duration) * 100)}%`,
					}}
				/>
				{playhead !== null && (
					<div
						className="waveform-playhead"
						style={{ left: percent(playhead) }}
						aria-hidden="true"
					/>
				)}
				{(["start", "end"] as const).map((which) => {
					const value = which === "start" ? safeStart : safeEnd;
					return (
						<button
							key={which}
							type="button"
							role="slider"
							className={`waveform-handle waveform-handle-${which}`}
							aria-label={`Trim ${which}`}
							aria-valuemin={
								which === "start" ? 0 : Math.min(duration, safeStart + gap)
							}
							aria-valuemax={
								which === "start" ? Math.max(0, safeEnd - gap) : duration
							}
							aria-valuenow={Number(value.toFixed(4))}
							aria-valuetext={`${value.toFixed(2)} seconds`}
							style={{ left: percent(value) }}
							onPointerDown={(event) => {
								event.preventDefault();
								event.currentTarget.setPointerCapture(event.pointerId);
								point(which, event);
							}}
							onPointerMove={(event) => {
								if (event.currentTarget.hasPointerCapture(event.pointerId))
									point(which, event);
							}}
							onKeyDown={(event) => keyboard(which, event)}
						>
							<span>{which === "start" ? "IN" : "OUT"}</span>
						</button>
					);
				})}
			</div>
			<div className="waveform-times">
				<span>In {safeStart.toFixed(2)} s</span>
				<span>Selection {Math.max(0, safeEnd - safeStart).toFixed(2)} s</span>
				<span>Out {safeEnd.toFixed(2)} s</span>
			</div>
			<p className="waveform-help">
				Drag IN and OUT to cut your sample. Use arrow keys for precise
				adjustment.
			</p>
		</div>
	);
}
