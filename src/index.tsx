import './styles/tailwind.css'
import { render } from 'solid-js/web'
import { loadLocaleDictionary } from './i18n'
import { localePreference } from './stores/localePreferences'
import { applyLocalePreference } from './utils/localePreference'
import { applyInitialAccent, applyInitialTheme } from './utils/themePreference'

applyInitialTheme()
applyInitialAccent()
applyLocalePreference(localePreference())

/**
 * 表示言語の辞書を読み込んでからアプリを描画する。
 * 画面の定数は読み込み時に文言を参照するため、辞書の読み込み後にアプリ本体を読み込む。
 * @returns 描画完了時に解決される Promise
 */
const start = async (): Promise<void> => {
  await loadLocaleDictionary(localePreference())
  const [{ default: App }, { AppQueryProvider }] = await Promise.all([
    import('./App'),
    import('./components/AppQueryProvider'),
  ])

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
}

void start()
