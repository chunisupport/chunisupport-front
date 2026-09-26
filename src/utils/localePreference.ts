/** アプリケーションで選択できる表示言語 */
export const APP_LOCALES = ['ja', 'en', 'zh-TW', 'ko'] as const

/** アプリケーションで選択できる表示言語 */
export type AppLocale = (typeof APP_LOCALES)[number]

/** 表示言語を保存するlocalStorageのキー */
export const LOCALE_STORAGE_KEY = 'chunisupport-locale'

/** 表示言語ごとの日付・数値書式用ロケール */
const INTL_LOCALES: Record<AppLocale, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  'zh-TW': 'zh-TW',
  ko: 'ko-KR',
}

/** 保存値やブラウザ設定から判定できない場合の表示言語 */
export const DEFAULT_LOCALE: AppLocale = 'ja'

/**
 * 値がアプリケーションで扱える表示言語か判定する。
 * @param value 判定対象の値
 * @returns 表示言語として有効な場合は true
 */
export const isAppLocale = (value: unknown): value is AppLocale =>
  APP_LOCALES.some((locale) => locale === value)

/**
 * ブラウザの言語設定から、対応している表示言語を判定する。
 * 中国語は繁体字のみ対応しているため、zh 系はすべて繁体字として扱う。
 * @param languages ブラウザが優先する言語タグの一覧
 * @returns 最初に対応できた表示言語。対応言語がない場合は既定の表示言語
 */
export const detectLocaleFromLanguages = (languages: readonly string[]): AppLocale => {
  for (const language of languages) {
    const primary = language.toLowerCase().split('-')[0]
    if (primary === 'zh') {
      return 'zh-TW'
    }
    if (isAppLocale(primary)) {
      return primary
    }
  }

  return DEFAULT_LOCALE
}

/**
 * localStorageに保存された表示言語を読み取る。
 * 未保存の場合はブラウザの言語設定から判定する。
 * @returns 適用する表示言語
 */
export const readLocalePreference = (): AppLocale => {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isAppLocale(value)) {
      return value
    }

    return detectLocaleFromLanguages(window.navigator.languages)
  } catch {
    return DEFAULT_LOCALE
  }
}

/**
 * 表示言語をlocalStorageへ保存する。
 * @param locale 保存する表示言語
 * @returns 保存できた場合は true
 */
export const saveLocalePreference = (locale: AppLocale): boolean => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    return true
  } catch {
    return false
  }
}

/**
 * 表示言語に対応する日付・数値書式用のロケールを返す。
 * @param locale 表示言語
 * @returns Intl API に渡すロケール
 */
export const toIntlLocale = (locale: AppLocale): string => INTL_LOCALES[locale]

/**
 * 表示言語をルート要素の lang 属性へ反映する。
 * @param locale 反映する表示言語
 * @returns 反映した表示言語
 */
export const applyLocalePreference = (locale: AppLocale): AppLocale => {
  document.documentElement.lang = locale
  return locale
}
