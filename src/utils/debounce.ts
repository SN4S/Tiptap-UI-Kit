/**
 * Debounce utility
 * @description The sole debounce implementation in the entire repository, with cancel (discard pending calls) and flush (execute pending calls immediately).
 * Use flush instead of cancel if you don't want to lose the last call before component unmount (e.g. update event dispatch).
 */

export type DebouncedFn<T extends (...args: unknown[]) => void> = ((...args: Parameters<T>) => void) & {
  /** discard the pending call */
  cancel: () => void
  /** execute the pending call immediately (if any) */
  flush: () => void
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: Parameters<T> | null = null

  const debounced = ((...args: Parameters<T>) => {
    pendingArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const callArgs = pendingArgs
      pendingArgs = null
      fn(...(callArgs as Parameters<T>))
    }, delay)
  }) as DebouncedFn<T>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      const callArgs = pendingArgs
      pendingArgs = null
      if (callArgs) fn(...callArgs)
    }
  }

  return debounced
}
