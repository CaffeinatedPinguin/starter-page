/**
 * Outcome of an options use-case. The use-cases return this instead of
 * touching the DOM, so they can run (and be tested) without #options-root.
 *
 * Discriminated union: a successful result always carries `value`; a failed
 * result never does. Narrowing on `ok` therefore guarantees the payload.
 */
export type Success<T> = { ok: true; message: string; value: T };
export type Failure = { ok: false; message: string };
export type ActionResult<T = void> = Success<T> | Failure;

/** Success for operations without a payload (write/remove). */
export function ok(message: string): Success<void> {
    return {ok: true, message, value: undefined};
}

/** Success carrying a read payload. */
export function okValue<T>(message: string, value: T): Success<T> {
    return {ok: true, message, value};
}

export function fail(message: string): Failure {
    return {ok: false, message};
}

/** Normalizes an unknown thrown value into a stable, user-facing suffix. */
export function describeError(error: unknown): string {
    return error instanceof Error && error.message.length > 0 ? error.message : 'nieznany błąd';
}
