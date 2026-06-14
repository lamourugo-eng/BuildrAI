/** Extrait un message lisible depuis une erreur inconnue (Supabase, fetch, Error, etc.). */
export function getErrorMessage(err: unknown, fallback = 'Erreur inconnue'): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error_description === 'string' && record.error_description.trim()) {
      return record.error_description;
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }
  }
  return fallback;
}
