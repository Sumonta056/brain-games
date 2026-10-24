const PRAISE = ['Nice!', 'Great!', 'On a roll!', 'Lovely', 'Smooth', 'Keep going', 'Yes!', 'Brain on fire 🔥']
/** Floating encouragement. GameShell renders `cheers`; games call `cheer()`. */
export function useCheer() {
  const cheers = useState<{ id: number; text: string }[]>('cheers', () => [])
  function cheer(text?: string) {
    const c = { id: Date.now() + Math.random(), text: text ?? PRAISE[Math.floor(Math.random() * PRAISE.length)]! }
    cheers.value.push(c)
    setTimeout(() => {
      cheers.value = cheers.value.filter(x => x.id !== c.id)
    }, 1100)
  }
  return { cheers, cheer }
}
