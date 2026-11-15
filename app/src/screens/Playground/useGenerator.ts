import { useCallback, useEffect, useRef, useState } from 'react';
import { generateAsync } from '../../services/generation/generationClient';
import { encodeParams, toRequest, type PlaygroundParams } from './params';
import { toOutcome, type Outcome } from './runGeneration';

interface Done { key: string; outcome: Outcome | null; error: string | null; ms: number }

/** Generates in a worker when asked: once when the page opens, then only on `generate()`, so an admin can finish
    configuring first. Editing the settings leaves the last sky on screen, marked `stale`. A new request abandons the
    one in flight. `generate(p)` takes settings that are not in `params` yet (a seed just rolled). */
export function useGenerator(params: PlaygroundParams) {
  const key = encodeParams(params);
  const [done, setDone] = useState<Done | null>(null);
  const [running, setRunning] = useState(true);   // the page opens mid-run
  const ctrl = useRef<AbortController | null>(null);

  const start = useCallback((p: PlaygroundParams) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const k = encodeParams(p);
    const t0 = performance.now();
    void generateAsync(toRequest(p), { signal: c.signal }).then(r => {
      if (c.signal.aborted) return;
      const ms = Math.round(performance.now() - t0);
      setRunning(false);
      setDone(r.ok ? { key: k, outcome: toOutcome(r.data), error: null, ms } : { key: k, outcome: null, error: r.error, ms });
    });
  }, []);

  const generate = useCallback((p: PlaygroundParams = params) => { setRunning(true); start(p); }, [params, start]);

  /* the page opens with a sky; after that, only the button */
  useEffect(() => {
    start(params);
    return () => ctrl.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- first run only

  return {
    generate, running, stale: done?.key !== key,
    outcome: done?.outcome ?? null, error: done?.error ?? null, wallMs: done?.ms ?? 0,
    /** identifies the outcome shown (it lags `params` until generated again) */
    outcomeKey: done?.key ?? '',
  };
}
