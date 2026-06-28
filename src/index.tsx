import './styles/tailwind.css'
import { render } from 'solid-js/web'
import App from './App.tsx'
import { applyInitialTheme } from './utils/themePreference.ts'

applyInitialTheme()

const root = document.getElementById('root')
if (root) {
  render(() => <App />, root)
}
