export type ThemePreference = 'light' | 'dark' | 'system'

export type AppliedTheme = Exclude<ThemePreference, 'system'>

export const THEME_STORAGE_KEY = 'chunisupport-theme'
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * 保存済みテーマ設定とOS設定から、実際に適用するテーマを決定する。
 * @param preference 保存済みテーマ設定
 * @param prefersDark OSがダークテーマを要求しているか
 * @returns ルート要素へ適用するテーマ
 */
export const resolveAppliedTheme = (
  preference: ThemePreference | null,
  prefersDark: boolean
): AppliedTheme => {
  if (preference === 'light' || preference === 'dark') {
    return preference
  }

  return prefersDark ? 'dark' : 'light'
}

/**
 * localStorageに保存されたテーマ設定を読み取る。
 * @returns 有効なテーマ設定。未設定または不正値の場合はsystem
 */
export const readThemePreference = (): ThemePreference => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value
    }
  } catch {
    return 'system'
  }

  return 'system'
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
 * OSのテーマ設定変更時にsystem設定の表示テーマを再適用する。
 * @param getPreference 現在のテーマ設定を返す関数
 * @returns 監視を解除する関数
 */
export const subscribeSystemThemeChange = (getPreference: () => ThemePreference): (() => void) => {
  const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY)
  const handleChange = () => {
    if (getPreference() === 'system') {
      applyThemePreference('system')
    }
  }

  mediaQueryList.addEventListener('change', handleChange)
  return () => mediaQueryList.removeEventListener('change', handleChange)
}

/**
 * アプリ描画前にルート要素へテーマ属性を付与する。
 * @returns 実際に適用されたテーマ
 */
export const applyInitialTheme = (): AppliedTheme => {
  return applyThemePreference(readThemePreference())
}
