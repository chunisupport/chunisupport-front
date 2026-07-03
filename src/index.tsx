import './styles/tailwind.css'
import { render } from 'solid-js/web'
import App from './App'
import { applyInitialAccent, applyInitialTheme } from './utils/themePreference'

applyInitialTheme()
applyInitialAccent()

const root = document.getElementById('root')
if (root) {
  render(() => <App />, root)
}
