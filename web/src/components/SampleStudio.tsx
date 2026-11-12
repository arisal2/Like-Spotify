import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SampleMixer } from "../audio/sampleMixer";
import {
	deleteSample,
	loadSamples,
	saveSample,
	type Sample,
} from "../audio/sampleStore";
import { SynthStudio } from "./SynthStudio";
import { SoundMatcher } from "./SoundMatcher";
import { SampleEditor } from "./SampleEditor";
import "./sampleStudio.css";

const maxBytes = 20 * 1024 * 1024;
export function SampleStudio() {
	const [samples, setSamples] = useState<Sample[]>([]);
	const [album, setAlbum] = useState("My first album");
	const [newAlbum, setNewAlbum] = useState("");
	const [editorInput, setEditorInput] = useState<{
		audio: Blob;
		name: string;
	} | null>(null);
	const [theme, setTheme] = useState(() => {
		try {
			return localStorage.getItem("bedlam.theme") ?? "moss";
		} catch {
			return "moss";
		}
	});
	const navigate = useNavigate();
	const view = useLocation().pathname === "/studio/synth" ? "synth" : "samples";
	const [status, setStatus] = useState("Loading your library…");
	const mixer = useRef<SampleMixer | null>(null);
	useEffect(() => {
		let mounted = true;
		void loadSamples()
			.then((items) => {
				if (mounted) {
					setSamples(items);
					setStatus("Your library is saved in this browser.");
				}
			})
			.catch(() => {
				if (mounted)
					setStatus(
						"Could not open browser storage. Check your browser settings.",
					);
			});
		return () => {
			mounted = false;
			mixer.current?.dispose();
			mixer.current = null;
		};
	}, []);
	const tracks = samples.filter((sample) => sample.album === album);
	const albums = Array.from(
		new Set([
			"My first album",
			...samples.map((sample) => sample.album),
			album,
		]),
	);
	async function importFiles(files: FileList | null) {
		if (!files) return;
		for (const file of Array.from(files)) {
			if (
				!file.type.startsWith("audio/") ||
				file.size === 0 ||
				file.size > maxBytes
			) {
				setStatus(
					`Could not add ${file.name}: choose an audio file up to 20 MB.`,
				);
				continue;
			}
			const sample: Sample = {
				id: crypto.randomUUID(),
				name: file.name,
				album,
				audio: file,
				volume: 0.7,
				pan: 0,
				muted: false,
			};
			try {
				await saveSample(sample);
				setSamples((old) => [...old, sample]);
				setStatus(`Added ${file.name} to ${album}.`);
			} catch {
				setStatus(`Could not save ${file.name}. Browser storage may be full.`);
			}
		}
	}
	async function update(sample: Sample) {
		try {
			await saveSample(sample);
			setSamples((old) =>
				old.map((item) => (item.id === sample.id ? sample : item)),
			);
		} catch {
			setStatus("Could not save this mixer change.");
		}
	}
	async function remove(sample: Sample) {
		if (!window.confirm(`Remove ${sample.name} from this browser's library?`))
			return;
		try {
			await deleteSample(sample.id);
			setSamples((old) => old.filter((item) => item.id !== sample.id));
			setStatus(`Removed ${sample.name}.`);
		} catch {
			setStatus("Could not remove this sample.");
		}
	}
	async function play(items: Sample[]) {
		try {
			mixer.current ??= new SampleMixer();
			await mixer.current.play(items);
			setStatus(
				"Playing samples together. Stop playback before changing the mix.",
			);
		} catch {
			setStatus(
				"Could not play one of these samples. Try a supported audio format.",
			);
		}
	}
	return (
		<div className="sample-app" data-theme={theme}>
			<aside className="sample-sidebar">
				<div className="sample-brand">
					BEDLAM <span>STUDIO</span>
				</div>
				<p>MAKE SOMETHING LOUDER.</p>
				<nav aria-label="Studio navigation">
					<button
						className={view === "samples" ? "selected" : ""}
						onClick={() => navigate("/")}
					>
						Sample library
					</button>
					<button
						className={view === "synth" ? "selected" : ""}
						onClick={() => {
							mixer.current?.stop();
							navigate("/studio/synth");
						}}
					>
						Synthesizer
					</button>
				</nav>
				<label className="theme-picker">
					Theme
					<select
						aria-label="Theme"
						value={theme}
						onChange={(event) => {
							const value = event.target.value;
							setTheme(value);
							try {
								localStorage.setItem("bedlam.theme", value);
							} catch {
								/* Theme remains active for this session. */
							}
						}}
					>
						<option value="moss">Moss</option>
						<option value="cyberpunk">Cyberpunk</option>
						<option value="retro">Retro</option>
						<option value="ocean">Ocean</option>
					</select>
				</label>
				<div className="sample-note">
					Your sounds live on this browser. Keep a copy of your original files.
				</div>
			</aside>
			<main className="sample-main">
				{view === "synth" ? (
					<SynthStudio
						onSendToEditor={(audio, name) => {
							setEditorInput({ audio, name });
							navigate("/");
						}}
					/>
				) : (
					<>
						<header className="sample-header">
							<div>
								<span className="eyebrow">YOUR CREATIVE SPACE</span>
								<h1>Make some noise.</h1>
								<p>
									Bring your sounds together, find a balance, and build your
									next idea.
								</p>
							</div>
							<label className="sample-upload">
								+ Add samples
								<input
									type="file"
									accept="audio/*"
									multiple
									onChange={(event) => {
										void importFiles(event.currentTarget.files);
										event.currentTarget.value = "";
									}}
								/>
							</label>
						</header>
						<SoundMatcher
							onEdit={(recording) =>
								setEditorInput({ audio: recording, name: "Recording" })
							}
							onSave={async (recording) => {
								const sample: Sample = {
									id: crypto.randomUUID(),
									name: `Recording ${new Date().toLocaleString()}`,
									album,
									audio: recording,
									volume: 0.7,
									pan: 0,
									muted: false,
								};
								await saveSample(sample);
								setSamples((old) => [...old, sample]);
							}}
						/>
						{editorInput && (
							<SampleEditor
								key={editorInput.name + String(editorInput.audio.size)}
								input={editorInput}
								onClose={() => setEditorInput(null)}
								onSave={async (audio, name) => {
									const sample: Sample = {
										id: crypto.randomUUID(),
										name: `${name.replace(/\.wav$/i, "")}.wav`,
										album,
										audio,
										volume: 0.7,
										pan: 0,
										muted: false,
									};
									await saveSample(sample);
									setSamples((old) => [...old, sample]);
								}}
							/>
						)}
						<section className="sample-section">
							<div className="sample-section-title">
								<div>
									<span className="eyebrow">COLLECTIONS</span>
									<h2>Your albums</h2>
								</div>
								<form
									onSubmit={(event) => {
										event.preventDefault();
										const name = newAlbum.trim();
										if (name) {
											setAlbum(name);
											setNewAlbum("");
										}
									}}
								>
									<label htmlFor="album-name" className="visually-hidden">
										New album name
									</label>
									<input
										id="album-name"
										placeholder="New album name"
										maxLength={80}
										value={newAlbum}
										onChange={(event) => setNewAlbum(event.target.value)}
									/>
									<button type="submit">Create</button>
								</form>
							</div>
							<div className="album-chips">
								{albums.map((name) => (
									<button
										key={name}
										className={album === name ? "selected" : ""}
										aria-pressed={album === name}
										onClick={() => {
											mixer.current?.stop();
											setAlbum(name);
										}}
									>
										{name}
									</button>
								))}
							</div>
							<p className="sample-hint">
								An album is saved when you add its first sample.
							</p>
						</section>
						<section className="sample-section">
							<div className="sample-section-title">
								<div>
									<span className="eyebrow">SIMPLE MIXER</span>
									<h2>{album}</h2>
									<p>
										Play individual sounds or layer them from the beginning.
									</p>
								</div>
								<div className="sample-actions">
									<button
										disabled={!tracks.length}
										onClick={() => void play(tracks)}
									>
										▶ Play mix
									</button>
									<button
										onClick={() => {
											mixer.current?.stop();
											setStatus("Playback stopped.");
										}}
									>
										■ Stop
									</button>
								</div>
							</div>
							{tracks.length === 0 ? (
								<div className="sample-empty">
									<strong>Your sound starts here.</strong>
									<p>Add audio files to this album and play them together.</p>
								</div>
							) : (
								<div className="sample-list">
									{tracks.map((sample) => (
										<article className="sample-track" key={sample.id}>
											<div className="sample-track-name">
												<span>♪</span>
												<strong>{sample.name}</strong>
											</div>
											<button
												onClick={() => {
													mixer.current?.stop();
													setEditorInput({
														audio: sample.audio,
														name: sample.name,
													});
												}}
												aria-label={`Edit ${sample.name}`}
											>
												Edit
											</button>
											<button
												onClick={() => void play([{ ...sample, muted: false }])}
												aria-label={`Play ${sample.name}`}
											>
												▶
											</button>
											<label>
												Volume{" "}
												<input
													type="range"
													min="0"
													max="1"
													step="0.05"
													value={sample.volume}
													onChange={(event) =>
														void update({
															...sample,
															volume: event.currentTarget.valueAsNumber,
														})
													}
													aria-label={`Volume for ${sample.name}`}
												/>
											</label>
											<label>
												Pan{" "}
												<input
													type="range"
													min="-1"
													max="1"
													step="0.1"
													value={sample.pan}
													onChange={(event) =>
														void update({
															...sample,
															pan: event.currentTarget.valueAsNumber,
														})
													}
													aria-label={`Pan for ${sample.name}`}
												/>
											</label>
											<button
												aria-pressed={sample.muted}
												onClick={() =>
													void update({ ...sample, muted: !sample.muted })
												}
											>
												{sample.muted ? "Unmute" : "Mute"}
											</button>
											<button
												onClick={() => void remove(sample)}
												aria-label={`Remove ${sample.name}`}
											>
												×
											</button>
										</article>
									))}
								</div>
							)}
							<p className="sample-status" role="status">
								{status}
							</p>
						</section>
					</>
				)}
			</main>
		</div>
	);
}
