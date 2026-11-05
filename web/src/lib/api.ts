import { z } from "zod";

export const songSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  albumId: z.number().int(),
  duration: z.number(),
  artwork: z.string(),
  audio: z.string(),
  tags: z.array(z.string()),
});
export const playlistSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  songIds: z.array(z.number().int()),
});
export const sessionSchema = z.object({
  user: z
    .object({ id: z.number().int(), username: z.string(), name: z.string() })
    .nullable(),
  csrfToken: z.string(),
});
export const mixSchema = z.object({
  name: z.string(),
  description: z.string(),
  songIds: z.array(z.number().int()),
  source: z.enum(["ai", "local", "local_fallback"]),
});
export type Song = z.infer<typeof songSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Mix = z.infer<typeof mixSchema>;

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
let csrfToken = "";
export function setCSRF(value: string) {
  csrfToken = value;
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      "X-CSRF-Token": csrfToken,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = z
      .object({ error: z.object({ message: z.string() }) })
      .safeParse(body);
    throw new ApiError(
      parsed.success
        ? parsed.data.error.message
        : "The server is unavailable. Please try again.",
      response.status,
    );
  }
  return schema.parse(
    response.status === 204 ? undefined : await response.json(),
  );
}
export const api = {
  session: async () => {
    const session = await request("/auth/session", sessionSchema);
    setCSRF(session.csrfToken);
    return session;
  },
  catalog: (signal?: AbortSignal) =>
    request("/catalog", z.object({ songs: z.array(songSchema) }), { signal }),
  login: (body: { username: string; password: string }) =>
    request("/auth/login", sessionSchema, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { username: string; name: string; password: string }) =>
    request("/auth/register", sessionSchema, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request("/auth/logout", z.undefined(), { method: "POST" }),
  playlists: () =>
    request("/playlists", z.object({ playlists: z.array(playlistSchema) })),
  savePlaylist: (body: { name: string; songIds: number[] }, id?: number) =>
    request(`/playlists${id ? `/${id}` : ""}`, playlistSchema, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    }),
  deletePlaylist: (id: number) =>
    request(`/playlists/${id}`, z.undefined(), { method: "DELETE" }),
  likes: () =>
    request("/likes", z.object({ songIds: z.array(z.number().int()) })),
  like: (id: number, liked: boolean) =>
    request(`/likes/${id}`, z.undefined(), {
      method: liked ? "PUT" : "DELETE",
    }),
  mix: (prompt: string) =>
    request("/mixes/preview", mixSchema, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
