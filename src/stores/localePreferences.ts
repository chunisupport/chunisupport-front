import { createSignal } from 'solid-js'
import { type AppLocale, readLocalePreference, saveLocalePreference } from '../utils/localePreference'

export const [localePreference, setLocalePreferenceSignal] = createSignal<AppLocale>(
  readLocalePreference()
)

/**
 * 表示言語を保存し、画面を再読み込みして反映する。
 * 定数やキャッシュ済みの表示文言も含めて確実に切り替えるため、再読み込みで反映する。
 * @param locale 適用する表示言語
 * @returns なし
 */
export const updateLocalePreference = (locale: AppLocale): void => {
  if (locale === localePreference()) {
    return
  }

  saveLocalePreference(locale)
  window.location.reload()
}
