import './styles/tailwind.css'
import { render } from 'solid-js/web'
import App from './App'
import { applyInitialTheme } from './utils/themePreference'

applyInitialTheme()

const root = document.getElementById('root')
if (root) {
  render(() => <App />, root)
}
