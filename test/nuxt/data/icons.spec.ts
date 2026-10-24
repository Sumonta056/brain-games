import { describe, expect, it } from 'vitest'

const iconFiles = import.meta.glob<string>('~/assets/icons/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})
const vueFiles = import.meta.glob<string>('~/**/*.vue', { query: '?raw', import: 'default', eager: true })

const icon = (path: string) => Object.entries(iconFiles).find(([key]) => key.endsWith(`/icons/${path}.svg`))?.[1]

const NAV = ['home', 'games', 'user', 'sun', 'moon', 'auto', 'back', 'flame']
const BRAND = ['logo', 'neurons']

describe('SVG icon files (CLAUDE.md rule 11)', () => {
  it.each(NAV)('has the nav icon nav/%s.svg drawn in currentColor', name => {
    const svg = icon(`nav/${name}`)
    expect(svg, `app/assets/icons/nav/${name}.svg`).toBeDefined()
    expect(svg).toMatch(/^\s*<svg[\s>]/)
    expect(svg).toMatch(/viewBox="[^"]+"/)
    expect(svg).toContain('currentColor')
  })

  it('draws a distinct shape for every nav icon', () => {
    const shapes = NAV.map(name => icon(`nav/${name}`))
    shapes.forEach((s, i) => expect(s, NAV[i]).toBeDefined())
    expect(new Set(shapes).size).toBe(NAV.length)
  })

  it.each(BRAND)('has the brand icon brand/%s.svg', name => {
    const svg = icon(`brand/${name}`)
    expect(svg, `app/assets/icons/brand/${name}.svg`).toBeDefined()
    expect(svg).toMatch(/^\s*<svg[\s>]/)
    expect(svg).toMatch(/viewBox="[^"]+"/)
  })

  it('draws the logo square with theme colours so both themes work', () => {
    const svg = icon('brand/logo')
    expect(svg).toBeDefined()
    expect(svg).toContain('viewBox="0 0 48 48"')
    const colours = [...svg!.matchAll(/\s(?:fill|stroke)="([^"]+)"/g)].map(m => m[1]).filter(v => v !== 'none')
    expect(colours.length).toBeGreaterThan(0)
    colours.forEach(v => expect(v).toMatch(/^(var\(--|currentColor$)/))
  })

  it('keeps every icon file free of scripts and event handlers', () => {
    expect(Object.keys(iconFiles).length).toBeGreaterThanOrEqual(NAV.length + BRAND.length + 15)
    for (const [path, svg] of Object.entries(iconFiles)) {
      expect(svg, path).not.toMatch(/<script/i)
      expect(svg, path).not.toMatch(/\son[a-z]+\s*=/i)
    }
  })

  it('has no inline svg markup in any Vue component', () => {
    expect(Object.keys(vueFiles).length).toBeGreaterThan(0)
    const inline = Object.entries(vueFiles)
      .filter(([, src]) => /<svg[\s>]/.test(src))
      .map(([path]) => path)
    expect(inline).toEqual([])
  })

  it('has a file for every bg icon name used in the app', () => {
    const used = Object.values(vueFiles).flatMap(src => [...src.matchAll(/name="bg:([a-z]+)-([a-z0-9-]+)"/g)])
    expect(used.length).toBeGreaterThan(0)
    for (const [, folder, name] of used) expect(icon(`${folder}/${name}`), `${folder}/${name}`).toBeDefined()
  })
})
