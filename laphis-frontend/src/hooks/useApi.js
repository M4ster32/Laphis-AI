import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Generic async data-fetching hook.
 * Encapsulates loading, error and data state so every page
 * follows the same pattern without repetitive boilerplate.
 *
 * @param {Function} fetchFn  - Async function that returns data.
 * @param {Object}   [opts]
 * @param {boolean}  [opts.immediate=false] - Fire fetchFn on mount.
 * @param {*}        [opts.initialData=null] - Seed value for data before first fetch.
 * @returns {{ data: *, loading: boolean, error: string|null, execute: Function, setData: Function, reset: Function }}
 *
 * @example
 * const { data: logs, loading, execute: reload } = useApi(
 *   () => ApiService.getLogs(100, 0),
 *   { immediate: true, initialData: [] }
 * );
 */
export function useApi(fetchFn, { immediate = false, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  /* Prevent state updates after unmount */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /**
   * Execute the fetch function with optional arguments.
   * Returns the result or throws on failure.
   */
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(...args);
      if (mountedRef.current) setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      if (mountedRef.current) setError(message);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetchFn]);

  /** Reset hook back to its initial state */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  /* Auto-fetch on mount when immediate is true */
  useEffect(() => {
    if (immediate) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, execute, setData, reset };
}
