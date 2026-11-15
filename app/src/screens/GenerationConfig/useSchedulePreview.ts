import { useCallback, useEffect, useRef, useState } from 'react';
import { daySeed } from '../../domain/calendar';
import type { GenerationSchedule } from '../../domain/generation';
import { previewDayAsync, type SitePreview } from '../../services/generation/scheduleClient';

interface Done { key: string; sites: SitePreview[] | null; error: string | null }

/** The week a schedule makes on a day, generated in a worker when asked: once when the page opens, then only on
    `generate()`, so an admin can finish editing first. A changed draft or day leaves the last week on screen, marked
    `stale`. A new request abandons the one in flight. */
export function useSchedulePreview(schedule: GenerationSchedule, day: number) {
  const key = day + ':' + JSON.stringify(schedule);
  const [done, setDone] = useState<Done | null>(null);
  const [running, setRunning] = useState(true);   // the page opens mid-run
  const ctrl = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    void previewDayAsync(schedule, daySeed(day), { signal: c.signal }).then(r => {
      if (c.signal.aborted) return;
      setRunning(false);
      setDone(r.ok ? { key, sites: r.data, error: null } : { key, sites: null, error: r.error });
    });
  }, [schedule, day, key]);

  const generate = useCallback(() => { setRunning(true); start(); }, [start]);

  /* the page opens with a week; after that, only the button */
  useEffect(() => {
    start();
    return () => ctrl.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- first run only

  return {
    generate, running, stale: done?.key !== key, sites: done?.sites ?? null, error: done?.error ?? null,
    /** identifies the preview shown (it lags the draft until generated again) */
    previewKey: done?.key ?? '',
  };
}
