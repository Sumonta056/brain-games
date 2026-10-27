import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import wordlist from 'wordlist-english'

const LEVEL = 60
const LEVEL_KEY = /^english(?:\/(?:american|british|canadian))?\/(\d+)$/
const CONTRACTIONS = [
  "aren't",
  "can't",
  "couldn't",
  "didn't",
  "doesn't",
  "don't",
  "hadn't",
  "hasn't",
  "haven't",
  "he'd",
  "he'll",
  "here's",
  "how's",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "isn't",
  "it'd",
  "it'll",
  "it's",
  "let's",
  "mightn't",
  "mustn't",
  "needn't",
  "oughtn't",
  "shan't",
  "she'd",
  "she'll",
  "she's",
  "shouldn't",
  "that'll",
  "that's",
  "there's",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "wasn't",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "weren't",
  "what's",
  "where's",
  "who'd",
  "who'll",
  "who's",
  "won't",
  "wouldn't",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "ain't",
  "could've",
  "he's",
  "how'd",
  "ma'am",
  "might've",
  "must've",
  "should've",
  "that'd",
  "there'll",
  "what'll",
  "who've",
  "would've"
]

const out = resolve(import.meta.dirname, '../app/data/wordlists')
const guard = process.env.CLIENT_GUARD_PATTERNS ?? resolve(homedir(), '.config/git/client-data-patterns')
const patterns = existsSync(guard)
  ? readFileSync(guard, 'utf8')
      .split('\n')
      .filter(l => l.trim() && !/^\s*#/.test(l))
  : []
const blocked = patterns.length ? new RegExp(patterns.join('|'), 'i') : null
const words = new Set(CONTRACTIONS)
for (const [key, list] of Object.entries(wordlist)) {
  const level = key.match(LEVEL_KEY)?.[1]
  if (level && Number(level) <= LEVEL) for (const w of list) if (/^[a-z]+$/.test(w) && !blocked?.test(w)) words.add(w)
}

mkdirSync(out, { recursive: true })
for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
  const list = [...words].filter(w => w[0] === letter).sort()
  writeFileSync(resolve(out, `${letter}.txt`), `${list.join('\n')}\n`)
}
const pkg = dirname(createRequire(import.meta.url).resolve('wordlist-english/package.json'))
const licenses = resolve(import.meta.dirname, '../public/licenses')
mkdirSync(licenses, { recursive: true })
copyFileSync(resolve(pkg, 'Copyright'), resolve(out, 'COPYRIGHT'))
copyFileSync(resolve(pkg, 'Copyright'), resolve(licenses, 'scowl.txt'))
console.log(`${words.size} words written to ${out}`)
