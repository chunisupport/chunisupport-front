import { createSignal } from 'solid-js'
import {
  type AppLocale,
  applyLocalePreference,
  readLocalePreference,
  saveLocalePreference,
} from '../utils/localePreference'

export const [localePreference, setLocalePreferenceSignal] = createSignal<AppLocale>(
  readLocalePreference()
)

/**
 * 表示言語を共有状態、永続ストレージ、ルート要素へ反映する。
 * @param locale 適用する表示言語
 * @returns なし
 */
export const updateLocalePreference = (locale: AppLocale): void => {
  saveLocalePreference(locale)
  applyLocalePreference(locale)
  setLocalePreferenceSignal(locale)
}
