import copy from '~/data/copy.json'

/** Floating encouragement. GameShell renders `cheers`; games call `cheer()`. */
export function useCheer() {
  const cheers = useState<{ id: number; text: string }[]>('cheers', () => [])
  function cheer(text?: string) {
    const c = {
      id: Date.now() + Math.random(),
      text: text ?? copy.praise[Math.floor(Math.random() * copy.praise.length)]!
    }
    cheers.value.push(c)
    setTimeout(() => {
      cheers.value = cheers.value.filter(x => x.id !== c.id)
    }, 1100)
  }
  return { cheers, cheer }
}
