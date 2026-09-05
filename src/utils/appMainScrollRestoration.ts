/** アプリ本体のスクロールコンテナID */
export const APP_MAIN_ELEMENT_ID = 'app-main'

const scrollOffsetsByPath = new Map<string, number>()

/**
 * メインスクロール要素の現在の縦位置を取得する。
 *
 * @returns `#app-main` の scrollTop。未描画時は 0。
 */
export const getAppMainScrollTop = (): number => {
  const scrollElement = document.getElementById(APP_MAIN_ELEMENT_ID)
  return scrollElement?.scrollTop ?? 0
}

/**
 * パスごとのスクロール位置を保存する。
 *
 * @param pathKey - 復元対象のパス。
 * @param offset - 保存する縦スクロール位置。
 */
export const saveAppMainScrollOffset = (pathKey: string, offset: number): void => {
  scrollOffsetsByPath.set(pathKey, offset)
}

/**
 * 保存済みのスクロール位置を取得する。
 *
 * @param pathKey - 復元対象のパス。
 * @returns 保存済み位置。未保存なら undefined。
 */
export const getAppMainScrollOffset = (pathKey: string): number | undefined =>
  scrollOffsetsByPath.get(pathKey)

/**
 * メインスクロール要素を指定位置へ復元する。
 *
 * @param offset - 復元する縦スクロール位置。
 */
export const restoreAppMainScrollOffset = (offset: number): void => {
  const scrollElement = document.getElementById(APP_MAIN_ELEMENT_ID)
  if (!scrollElement) return

  scrollElement.scrollTo({
    top: offset,
    behavior: 'auto',
  })
}

/**
 * 保存済みのスクロール位置をすべて破棄する。
 */
export const clearAppMainScrollOffsets = (): void => {
  scrollOffsetsByPath.clear()
}
