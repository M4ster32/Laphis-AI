import { useState, useCallback, useRef } from "react";

/**
 * Hook for optimistic UI updates.
 * Applies an instant visual change while the real async action runs
 * in the background. Automatically rolls back on failure so the user
 * sees a fast, fluid interface without data inconsistency.
 *
 * @param {*} initialValue - Starting state.
 * @returns {[value: *, optimisticUpdate: Function, isPending: boolean, sync: Function]}
 *
 * @example
 * const [water, updateWater, isPending, syncWater] = useOptimistic(waterData);
 *
 * const handleAdd = () => updateWater(
 *   { ...water, glasses: water.glasses + 1 },
 *   () => ApiService.addWater(1)
 * );
 */
export function useOptimistic(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const previousRef = useRef(initialValue);

  /**
   * Optimistically set a new value and run the async action.
   * If the action fails the value is rolled back to the previous state.
   *
   * @param {*}        nextValue - The optimistic state to display immediately.
   * @param {Function} asyncFn   - Async function to run in the background.
   * @returns {Promise<*>} Resolves with the async function result.
   */
  const optimisticUpdate = useCallback(async (nextValue, asyncFn) => {
    previousRef.current = value;
    setValue(nextValue);
    setPending(true);
    try {
      const result = await asyncFn();
      /* Use server response when available to ensure data consistency */
      if (result !== undefined) setValue(result);
      return result;
    } catch (err) {
      /* Rollback on failure */
      setValue(previousRef.current);
      throw err;
    } finally {
      setPending(false);
    }
  }, [value]);

  /**
   * Manually sync value from an external source (e.g. after a refetch).
   * Also updates the rollback reference.
   */
  const sync = useCallback((newValue) => {
    setValue(newValue);
    previousRef.current = newValue;
  }, []);

  return [value, optimisticUpdate, pending, sync];
}
