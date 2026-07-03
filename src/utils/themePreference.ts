/** ユーザーが選択・保存できる背景テーマ。 */
export type ThemePreference = 'light' | 'pastel-orange' | 'dark' | 'black'

/** ルート要素へ実際に適用する背景テーマ。 */
export type AppliedTheme = ThemePreference

/** 背景テーマから独立して適用する操作強調色。 */
export type AccentPreference = 'green' | 'orange' | 'blue'

export const THEME_STORAGE_KEY = 'chunisupport-theme'
export const ACCENT_STORAGE_KEY = 'chunisupport-accent'
/** アプリケーションで使用する既定のアクセントカラー。 */
export const DEFAULT_ACCENT: AccentPreference = 'green'
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * 保存済みテーマ設定とOS設定から、実際に適用するテーマを決定する。
 * @param preference 保存済みテーマ設定
 * @param prefersDark OSがダークテーマを要求しているか
 * @returns ルート要素へ適用するテーマ
 */
export const resolveAppliedTheme = (
  preference: ThemePreference | 'system' | null,
  prefersDark: boolean
): AppliedTheme => {
  if (
    preference === 'light' ||
    preference === 'pastel-orange' ||
    preference === 'dark' ||
    preference === 'black'
  ) {
    return preference
  }

  return prefersDark ? 'dark' : 'light'
}

/**
 * localStorageに保存されたテーマ設定を読み取る。
 * 旧system設定、未設定、不正値は現在のOS配色に対応する明示的なテーマへ移行する。
 * @returns 有効な明示的テーマ設定
 */
export const readThemePreference = (): ThemePreference => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'pastel-orange' || value === 'dark' || value === 'black') {
      return value
    }
  } catch {
    return resolveAppliedTheme(null, window.matchMedia(THEME_MEDIA_QUERY).matches)
  }

  const preference = resolveAppliedTheme(null, window.matchMedia(THEME_MEDIA_QUERY).matches)
  saveThemePreference(preference)
  return preference
}

/**
 * テーマ設定をlocalStorageへ保存する。
 * @param preference 保存するテーマ設定
 * @returns なし
 */
export const saveThemePreference = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // 保存できない環境でも、現在の表示テーマだけは反映できるようにする。
  }
}

/**
 * localStorageに保存されたアクセントカラー設定を読み取る。
 * @returns 有効なアクセントカラー。未設定または不正値の場合は既定値
 */
export const readAccentPreference = (): AccentPreference => {
  try {
    const value = window.localStorage.getItem(ACCENT_STORAGE_KEY)
    if (value === 'green' || value === 'orange' || value === 'blue') {
      return value
    }
  } catch {
    return DEFAULT_ACCENT
  }

  return DEFAULT_ACCENT
}

/**
 * アクセントカラー設定をlocalStorageへ保存する。
 * @param preference 保存するアクセントカラー
 * @returns なし
 */
export const saveAccentPreference = (preference: AccentPreference): void => {
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, preference)
  } catch {
    // 保存できない環境でも、現在のアクセントカラーだけは反映できるようにする。
  }
}

/**
 * アクセントカラー設定をルート要素へ適用する。
 * @param preference 適用するアクセントカラー
 * @returns 適用されたアクセントカラー
 */
export const applyAccentPreference = (preference: AccentPreference): AccentPreference => {
  document.documentElement.dataset.accent = preference
  return preference
}

/**
 * テーマ設定をルート要素へ適用する。
 * @param preference 適用するテーマ設定
 * @returns 実際に適用されたテーマ
 */
export const applyThemePreference = (preference: ThemePreference): AppliedTheme => {
  const prefersDark = window.matchMedia(THEME_MEDIA_QUERY).matches
  const appliedTheme = resolveAppliedTheme(preference, prefersDark)
  document.documentElement.dataset.theme = appliedTheme
  return appliedTheme
}

/**
 * アプリ描画前にルート要素へテーマ属性を付与する。
 * @returns 実際に適用されたテーマ
 */
export const applyInitialTheme = (): AppliedTheme => {
  return applyThemePreference(readThemePreference())
}

/**
 * アプリ描画前に保存済みのアクセントカラーをルート要素へ適用する。
 * @returns 適用されたアクセントカラー
 */
export const applyInitialAccent = (): AccentPreference => {
  return applyAccentPreference(readAccentPreference())
}
