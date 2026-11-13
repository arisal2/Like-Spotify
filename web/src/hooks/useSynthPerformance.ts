import { useEffect, useRef, useState } from "react";
import { SynthEngine } from "../audio/synthEngine";
import {
	PhraseRecorder,
	maxPhraseSeconds,
	type SynthNote,
} from "../audio/synthPhrase";
import type { SynthPatch } from "../audio/synthPatch";

export const synthKeys = [
	"a",
	"w",
	"s",
	"e",
	"d",
	"f",
	"t",
	"g",
	"y",
	"h",
	"u",
	"j",
];
const now = () => performance.now() / 1000;

export function useSynthPerformance(
	patch: SynthPatch,
	selectNote?: (note: number) => void,
) {
	const patchRef = useRef(patch);
	patchRef.current = patch;
	const engine = useRef<SynthEngine | null>(null);
	const held = useRef(
		new Map<number, { sources: Set<string>; patch: SynthPatch }>(),
	);
	const capture = useRef<PhraseRecorder | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [active, setActive] = useState<number[]>([]);
	const [recording, setRecording] = useState(false);
	const [take, setTake] = useState<SynthNote[]>([]);
	const [status, setStatus] = useState(
		"Play notes together, or record a phrase.",
	);
	function releaseAll() {
		for (const [index, entry] of held.current)
			engine.current?.noteOff(60 + index, entry.patch.release);
		held.current.clear();
		setActive([]);
	}
	function stopRecording() {
		const recorder = capture.current;
		if (!recorder) return;
		capture.current = null;
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		const notes = recorder.stop(now());
		setTake(notes);
		setRecording(false);
		releaseAll();
		setStatus(
			notes.length
				? `Phrase ready: ${notes.length} notes. Add it to the editor, then save a copy.`
				: "No notes recorded. Start a phrase and play the keys.",
		);
	}
	function startRecording() {
		if (capture.current) return;
		releaseAll();
		capture.current = new PhraseRecorder(now());
		setTake([]);
		setRecording(true);
		setStatus(
			"Recording a phrase for up to 30 seconds. Play notes or chords, then stop.",
		);
		timer.current = setTimeout(stopRecording, maxPhraseSeconds * 1000);
	}
	function startNote(index: number, source: string) {
		selectNote?.(60 + index);
		const entry = held.current.get(index);
		if (entry) {
			entry.sources.add(source);
			return;
		}
		const snapshot = { ...patchRef.current };
		if (
			capture.current &&
			!capture.current.noteOn(60 + index, snapshot, now())
		) {
			stopRecording();
			setStatus(
				"Phrase note limit reached. Your take is ready to add to the editor.",
			);
		}
		held.current.set(index, { sources: new Set([source]), patch: snapshot });
		setActive([...held.current.keys()]);
		engine.current ??= new SynthEngine();
		void engine.current.noteOn(60 + index, snapshot).catch(() => {
			setStatus("Audio could not start. Try another key.");
			endNote(index, source);
		});
	}
	function endNote(index: number, source: string) {
		const entry = held.current.get(index);
		if (!entry?.sources.delete(source) || entry.sources.size) return;
		held.current.delete(index);
		capture.current?.noteOff(60 + index, now());
		engine.current?.noteOff(60 + index, entry.patch.release);
		setActive([...held.current.keys()]);
	}
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
			const index = synthKeys.indexOf(event.key.toLowerCase());
			if (index < 0) return;
			event.preventDefault();
			startNote(index, `key:${event.key.toLowerCase()}`);
		};
		const up = (event: KeyboardEvent) => {
			const index = synthKeys.indexOf(event.key.toLowerCase());
			if (index >= 0) endNote(index, `key:${event.key.toLowerCase()}`);
		};
		const stop = () => {
			stopRecording();
			releaseAll();
			engine.current?.dispose();
			engine.current = null;
		};
		const visibility = () => {
			if (document.hidden) stop();
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("blur", stop);
		document.addEventListener("visibilitychange", visibility);
		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			window.removeEventListener("blur", stop);
			document.removeEventListener("visibilitychange", visibility);
			if (timer.current) clearTimeout(timer.current);
			capture.current = null;
			held.current.clear();
			engine.current?.dispose();
			engine.current = null;
		};
	}, []);
	return {
		active,
		recording,
		take,
		status,
		setStatus,
		startNote,
		endNote,
		startRecording,
		stopRecording,
	};
}
