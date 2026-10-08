import {
  normalizeUniFillMatrixViewSettings,
  type UniFillMatrixViewSettings,
} from '../../../utils/uniFillMatrix'
import {
  UNI_FILL_MATRIX_DEFAULT_VIEW_SETTINGS,
  UNI_FILL_MATRIX_VIEW_SETTINGS_STORAGE_KEY,
} from './constants'

/**
 * ウニ埋めマトリックスの表示設定を localStorage から読み取る。
 *
 * @returns 保存済みの表示設定。未設定・不正値・読み取り失敗時は既定値で補った設定。
 */
export const readUniFillMatrixViewSettings = (): UniFillMatrixViewSettings => {
  try {
    const value = window.localStorage.getItem(UNI_FILL_MATRIX_VIEW_SETTINGS_STORAGE_KEY)
    return normalizeUniFillMatrixViewSettings(
      value === null ? null : JSON.parse(value),
      UNI_FILL_MATRIX_DEFAULT_VIEW_SETTINGS
    )
  } catch {
    return UNI_FILL_MATRIX_DEFAULT_VIEW_SETTINGS
  }
}

/**
 * ウニ埋めマトリックスの表示設定を localStorage へ保存する。
 *
 * @param settings - 保存する表示設定。
 * @returns なし。
 */
export const saveUniFillMatrixViewSettings = (settings: UniFillMatrixViewSettings): void => {
  try {
    window.localStorage.setItem(UNI_FILL_MATRIX_VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // 保存できない環境でも、現在の表示設定は画面上で維持する。
  }
}
