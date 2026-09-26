import {
  type AppLocale,
  readLocalePreference,
  saveLocalePreference,
} from '../utils/localePreference'

/** 読み込み時に確定した表示言語。切り替えは再読み込みで反映する。 */
const CURRENT_LOCALE = readLocalePreference()

/**
 * 現在の表示言語を取得する。
 * @returns 現在の表示言語
 */
export const localePreference = (): AppLocale => CURRENT_LOCALE

/**
 * 表示言語を保存し、画面を再読み込みして反映する。
 * 定数やキャッシュ済みの表示文言も含めて確実に切り替えるため、再読み込みで反映する。
 * 保存できない環境では再読み込みしても反映されないため、何もしない。
 * @param locale 適用する表示言語
 * @returns なし
 */
export const updateLocalePreference = (locale: AppLocale): void => {
  if (locale === CURRENT_LOCALE) {
    return
  }

  if (saveLocalePreference(locale)) {
    window.location.reload()
  }
}
