/** Small celebratory burst on the #confetti canvas in the layout. Skipped for reduced motion. */
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.getElementById('confetti') as HTMLCanvasElement | null
  const ctx = cv?.getContext('2d')
  if (!cv || !ctx) return
  cv.width = innerWidth
  cv.height = innerHeight
  const cs = getComputedStyle(document.documentElement)
  const cols = [cs.getPropertyValue('--accent'), cs.getPropertyValue('--accent-2'), '#F6C445', '#5ED6A0', '#8EC3FF']
  const P = Array.from({ length: 120 }, () => ({
    x: innerWidth / 3,
    y: innerHeight / 3,
    vx: (Math.random() - 0.3) * 14,
    vy: Math.random() * -12 - 2,
    c: pick(cols),
    s: ri(5, 10),
    r: Math.random() * 6
  }))
  let n = 0
  const f = () => {
    ctx.clearRect(0, 0, cv.width, cv.height)
    for (const p of P) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.35
      p.r += 0.1
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6)
      ctx.restore()
    }
    if (++n < 120) requestAnimationFrame(f)
    else ctx.clearRect(0, 0, cv.width, cv.height)
  }
  f()
}
