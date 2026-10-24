export function useListGame(check: (w: string) => string | null, seconds: number, onEnd: (score: number) => void) {
  const { cheer } = useCheer()
  const items = ref<string[]>([])
  const feedback = ref({ text: '', ok: false })

  function submit(raw: string) {
    const w = raw.trim().toLowerCase()
    if (!w) return
    const err = check(w) || (items.value.includes(w) ? 'You already have that one' : null)
    if (err) {
      feedback.value = { text: err, ok: false }
      return
    }
    items.value = [w, ...items.value]
    feedback.value = { text: 'Added', ok: true }
    if (items.value.length % 5 === 0) cheer()
  }

  const { fraction, start } = useCountdown(seconds, () => onEnd(items.value.length))
  return { items, feedback, submit, fraction, start }
}
