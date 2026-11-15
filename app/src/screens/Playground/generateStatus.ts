/** The status word beside a Generate button. */
export function generateStatus(running: boolean, stale: boolean, error: string | null): string {
  return running ? 'generating…' : stale ? 'settings changed · generate to update' : error ? 'error' : 'ready';
}
