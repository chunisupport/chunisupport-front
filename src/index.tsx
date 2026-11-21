import './styles/tailwind.css'
import { render } from 'solid-js/web'
import App from './App'
import { AppQueryProvider } from './components/AppQueryProvider'
import { scheduleAnalyticsInitialization } from './lib/analytics'
import { watchTabIdentity } from './lib/firebase'
import { applyInitialAccent, applyInitialTheme } from './utils/themePreference'

watchTabIdentity()
applyInitialTheme()
applyInitialAccent()
scheduleAnalyticsInitialization()

const root = document.getElementById('root')
if (root) {
  render(
    () => (
      <AppQueryProvider>
        <App />
      </AppQueryProvider>
    ),
    root
  )
}
