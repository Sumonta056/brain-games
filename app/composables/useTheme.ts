/** auto → light → dark. "auto" follows the device; the CSS reads [data-theme]. */
export function useTheme() {
  const { progress } = useProgress()
  const theme = computed(() => progress.value.theme)
  useHead(() => ({ htmlAttrs: progress.value.theme === 'auto' ? {} : { 'data-theme': progress.value.theme } }))
  const cycle = () => {
    const t = progress.value.theme
    progress.value.theme = t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'
  }
  return { theme, cycle }
}
