export type Sample = {
	id: string;
	name: string;
	album: string;
	audio: Blob;
	volume: number;
	pan: number;
	muted: boolean;
};
const databaseName = "bedlam-sample-studio";

function database(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(databaseName, 1);
		request.onupgradeneeded = () =>
			request.result.createObjectStore("samples", { keyPath: "id" });
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function transaction<T>(
	mode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	const db = await database();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("samples", mode);
		const request = action(tx.objectStore("samples"));
		tx.oncomplete = () => {
			db.close();
			resolve(request.result);
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
		tx.onabort = () => {
			db.close();
			reject(tx.error ?? new Error("Storage transaction aborted"));
		};
	});
}

export const loadSamples = () =>
	transaction<Sample[]>("readonly", (store) => store.getAll());
export const saveSample = (sample: Sample) =>
	transaction("readwrite", (store) => store.put(sample));
export const deleteSample = (id: string) =>
	transaction("readwrite", (store) => store.delete(id));
