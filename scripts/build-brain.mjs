import { writeFileSync } from 'node:fs'

const N = 72
const CORE = { x: 190, y: 120 }
let seed = 7
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const inBrain = (x, y) =>
  (((x - 185) / 165) ** 2 + ((y - 118) / 100) ** 2 <= 1 && y < 200) ||
  ((x - 285) / 62) ** 2 + ((y - 205) / 38) ** 2 <= 1

const nodes = []
for (let tries = 0; nodes.length < N && tries < 20000; tries++) {
  const x = 20 + rnd() * 360
  const y = 15 + rnd() * 250
  if (!inBrain(x, y) || nodes.some(n => Math.hypot(n.x - x, n.y - y) < 22)) continue
  nodes.push({ x: Math.round(x), y: Math.round(y), s: Math.round(6 + rnd() * 6) })
}
if (nodes.length < N) throw new Error(`placed only ${nodes.length} of ${N} neurons`)
nodes.sort((a, b) => Math.hypot(a.x - CORE.x, a.y - CORE.y) - Math.hypot(b.x - CORE.x, b.y - CORE.y))

const seen = new Set()
const links = []
nodes.forEach((n, i) => {
  nodes
    .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
    .filter(o => o.j !== i && o.d < 70)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .forEach(({ j }) => {
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      if (!seen.has(`${a}-${b}`)) {
        seen.add(`${a}-${b}`)
        links.push([a, b])
      }
    })
})
links.sort((p, q) => p[1] - q[1] || p[0] - q[0])

writeFileSync(
  new URL('../app/data/brain.json', import.meta.url),
  JSON.stringify({ width: 400, height: 280, neurons: nodes, links }) + '\n'
)
console.log(`brain.json: ${nodes.length} neurons, ${links.length} links`)
