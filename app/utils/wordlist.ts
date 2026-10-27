const files = import.meta.glob<string>('~/data/wordlists/*.txt', { query: '?raw', import: 'default' })

export async function loadWordList(letter: string): Promise<Set<string>> {
  const load = Object.entries(files).find(([path]) => path.endsWith(`/${letter.toLowerCase()}.txt`))?.[1]
  if (!load) throw new Error(`No word list for ${letter}`)
  return new Set((await load()).split('\n').filter(Boolean))
}
