export async function validateAudioFile(file: File): Promise<void> {
	if (file.size === 0 || file.size > 20 * 1024 * 1024)
		throw new Error("Choose a non-empty audio file up to 20 MB.");
	const context = new AudioContext();
	try {
		const audio = await context.decodeAudioData(await file.arrayBuffer());
		if (audio.duration <= 0) throw new Error("Empty audio");
	} catch {
		throw new Error("This file could not be decoded as audio in your browser.");
	} finally {
		await context.close();
	}
}
