import { createSignal } from 'solid-js'

const STORAGE_KEY = 'chunisupport_theme'

function applyThemeClass(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const stored = localStorage.getItem(STORAGE_KEY)
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialDark = stored !== null ? stored === 'dark' : prefersDark

applyThemeClass(initialDark)

const [isDark, setIsDark] = createSignal(initialDark)

export { isDark }

export const toggleTheme = () => {
  const next = !isDark()
  setIsDark(next)
  localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
  applyThemeClass(next)
}
