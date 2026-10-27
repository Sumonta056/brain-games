import { describe, expect, it } from 'vitest'
import { loadWordList } from '~/utils/wordlist'

describe('loadWordList', () => {
  it.each(['S', 's'])('loads the s list for letter %s', async letter => {
    const words = await loadWordList(letter)
    expect(words).toBeInstanceOf(Set)
    expect(words.has('sun')).toBe(true)
    expect(words.has('smiled')).toBe(true)
    expect(words.has("shan't")).toBe(true)
    expect(words.has('sxqz')).toBe(false)
  })

  it('loads only words that start with the letter', async () => {
    const words = await loadWordList('S')
    expect(words.size).toBeGreaterThan(0)
    expect([...words].every(w => w.startsWith('s'))).toBe(true)
  })
})
