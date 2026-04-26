// Future real-backend boundary.
//
// When the real API arrives, every `features/*/api/*.ts` will import this
// client and replace its mock implementation with calls through `request`.
// Today this file is intentionally a stub — feature `api/` modules call
// `mocks/fixtures` directly. The swap should change only this file and the
// per-feature api modules.

export type ApiError = { status: number; message: string };

export async function request<T>(_path: string, _init?: RequestInit): Promise<T> {
  throw new Error("api/client: real backend not wired up yet");
}
