/** 横バーのコンパクトモードを保存する localStorage のキー */
export const NAV_BAR_COMPACT_MODE_STORAGE_KEY = 'chunisupport-nav-bar-compact-mode'

/**
 * localStorageから横バーのコンパクトモードを読み取る。
 * @returns コンパクトモードが有効なら true。未設定、不正値、読み取り不能の場合は false
 */
export const readNavBarCompactMode = (): boolean => {
  try {
    return window.localStorage.getItem(NAV_BAR_COMPACT_MODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * 横バーのコンパクトモードをlocalStorageへ保存する。
 * @param enabled コンパクトモードを有効にするか
 * @returns なし
 */
export const saveNavBarCompactMode = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(NAV_BAR_COMPACT_MODE_STORAGE_KEY, String(enabled))
  } catch {
    // 保存できない環境でも、現在の表示だけは切り替えられるようにする。
  }
}
