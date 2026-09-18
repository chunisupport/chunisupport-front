/** レーティング枠画像 Ver. 2 の表示設定パネル開閉状態を保存する localStorage キー */
export const RATING_IMAGE_V2_OPTIONS_OPEN_STORAGE_KEY = 'chunisupport-rating-image-v2-options-open'

/** レーティング枠画像 Ver. 2 の表示設定パネルの既定の開閉状態 */
export const RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT = true

/**
 * レーティング枠画像 Ver. 2 の表示設定パネルの開閉状態を読み取る。
 *
 * @returns 保存済みの開閉状態。未設定・不正値・読み取り失敗時は既定値。
 */
export const readRatingImageV2OptionsOpen = (): boolean => {
  try {
    const value = window.localStorage.getItem(RATING_IMAGE_V2_OPTIONS_OPEN_STORAGE_KEY)
    if (value === 'true') return true
    if (value === 'false') return false
  } catch {
    return RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT
  }

  return RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT
}

/**
 * レーティング枠画像 Ver. 2 の表示設定パネルの開閉状態を保存する。
 *
 * @param open - パネルが開いている場合は true。
 * @returns なし。
 */
export const saveRatingImageV2OptionsOpen = (open: boolean): void => {
  try {
    window.localStorage.setItem(RATING_IMAGE_V2_OPTIONS_OPEN_STORAGE_KEY, String(open))
  } catch {
    // 保存できない環境でも、現在の開閉状態は画面上で維持する。
  }
}
