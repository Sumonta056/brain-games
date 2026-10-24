/** Countdown that cleans itself up when the component unmounts. `fraction` drives the timer bar (1 → 0). */
export function useCountdown(seconds: number, onEnd: () => void) {
  const fraction = ref(1)
  let timer: ReturnType<typeof setInterval> | null = null
  function start() {
    stop()
    const end = Date.now() + seconds * 1000
    timer = setInterval(() => {
      const left = Math.max(0, end - Date.now())
      fraction.value = left / (seconds * 1000)
      if (left <= 0) {
        stop()
        onEnd()
      }
    }, 100)
  }
  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }
  onBeforeUnmount(stop)
  return { fraction, start, stop }
}

/** Timeouts that are all cleared on unmount — use for game sequencing instead of raw setTimeout. */
export function useTimeouts() {
  const ids = new Set<ReturnType<typeof setTimeout>>()
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.delete(id)
      fn()
    }, ms)
    ids.add(id)
  }
  const intervals = new Set<ReturnType<typeof setInterval>>()
  const every = (fn: () => void, ms: number) => {
    intervals.add(setInterval(fn, ms))
  }
  const clearAll = () => {
    ids.forEach(clearTimeout)
    ids.clear()
    intervals.forEach(clearInterval)
    intervals.clear()
  }
  onBeforeUnmount(clearAll)
  return { later, every, clearAll }
}
