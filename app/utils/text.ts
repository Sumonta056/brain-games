export const fillParts = (template: string, vars: Record<string, string | number>) =>
  template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map(part => {
      const key = part.match(/^\{(\w+)\}$/)?.[1]
      return key && key in vars ? { text: String(vars[key]), value: true } : { text: part, value: false }
    })

export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
