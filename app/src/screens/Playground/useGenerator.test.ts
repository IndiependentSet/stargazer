import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail } from '../../services/result';
import { DEFAULT_PARAMS } from './params';

const generateAsync = vi.fn();
vi.mock('../../services/generation/generationClient', () => ({ generateAsync: (...a: unknown[]) => generateAsync(...a) }));
const { useGenerator } = await import('./useGenerator');

beforeEach(() => { generateAsync.mockReset(); generateAsync.mockResolvedValue(fail('nope')); });

describe('useGenerator', () => {
  it('runs once on open, then only when asked', async () => {
    const { result, rerender } = renderHook(({ p }) => useGenerator(p), { initialProps: { p: DEFAULT_PARAMS } });
    await waitFor(() => expect(result.current.running).toBe(false));
    expect(generateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.stale).toBe(false);

    rerender({ p: { ...DEFAULT_PARAMS, size: DEFAULT_PARAMS.size + 1 } });
    await new Promise(r => setTimeout(r, 400));
    expect(generateAsync).toHaveBeenCalledTimes(1);   // an edit alone starts nothing
    expect(result.current.stale).toBe(true);

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.stale).toBe(false));
    expect(generateAsync).toHaveBeenCalledTimes(2);
  });
});
