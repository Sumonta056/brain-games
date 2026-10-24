import type { GameDef, CategoryDef, Category } from '~~/shared/types/game'
import categoriesJson from '../data/categories.json'

const modules = import.meta.glob<GameDef>('../data/games/*.json', { eager: true, import: 'default' })
const games: GameDef[] = Object.values(modules).sort((a, b) => a.order - b.order)
const categories = categoriesJson as Record<Category, CategoryDef>

export function useGames() {
  const byId = (id: string) => games.find(g => g.id === id)
  const tintVars = (cat: Category) => {
    const t = categories[cat].tint
    return { '--tbg': `var(--${t}-bg)`, '--tfg': `var(--${t}-fg)` }
  }
  const fg = (cat: Category) => `var(--${categories[cat].tint}-fg)`
  function todaysFive(): GameDef[] {
    const r = seeded(dayNum())
    const out: GameDef[] = []
    while (out.length < 5) {
      const g = games[Math.floor(r() * games.length)]!
      if (!out.includes(g)) out.push(g)
    }
    return out
  }
  return { games, categories, byId, tintVars, fg, todaysFive }
}
