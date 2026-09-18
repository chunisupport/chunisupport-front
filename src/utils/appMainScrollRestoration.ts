/** アプリ本体のスクロールコンテナID */
export const APP_MAIN_ELEMENT_ID = 'app-main'

const scrollOffsetsByPath = new Map<string, number>()

/** 直近の遷移先。履歴の戻る/進むは数値、リンク遷移はパス文字列。 */
let lastNavigationTarget: string | number = ''

/** popstate 処理中はリンク遷移として上書きしない */
let isHandlingPopState = false

/**
 * ブラウザの戻る/進むを履歴 pop として記録する。
 * `useBeforeLeave` の `event.to` がパス文字列になる場合でも、popstate を優先する。
 */
export const notifyAppMainScrollPopNavigation = (): void => {
  lastNavigationTarget = -1
  isHandlingPopState = true
  queueMicrotask(() => {
    isHandlingPopState = false
  })
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('popstate', notifyAppMainScrollPopNavigation, true)
}

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
 * 直近の遷移先を記録する。
 * popstate 処理中はパス文字列で上書きせず、履歴の戻る/進むとして扱う。
 *
 * @param to - `useBeforeLeave` の遷移先。履歴デルタなら数値。
 */
export const rememberAppMainScrollNavigationTarget = (to: string | number): void => {
  if (isHandlingPopState) {
    lastNavigationTarget = -1
    return
  }
  lastNavigationTarget = to
}

/**
 * 履歴の戻る/進む遷移かどうかを判定する。
 *
 * @param to - 遷移先。履歴デルタなら数値。
 * @returns 履歴の戻る/進むなら true。
 */
export const isHistoryPopNavigation = (to: string | number = lastNavigationTarget): boolean =>
  typeof to === 'number'

/**
 * 保存済み位置を復元してよいか判定し、復元する縦位置を返す。
 * サイドバーなど新規遷移では 0 を返し、ブラウザバック時だけ保存位置を使う。
 *
 * @param savedOffset - パスに紐づく保存済み位置。
 * @param navigationTarget - 直近の遷移先。
 * @returns 復元する縦スクロール位置。
 */
export const resolveRestoredAppMainScrollOffset = (
  savedOffset: number | undefined,
  navigationTarget: string | number = lastNavigationTarget
): number => (isHistoryPopNavigation(navigationTarget) ? (savedOffset ?? 0) : 0)

/**
 * 保存済みのスクロール位置をすべて破棄する。
 */
export const clearAppMainScrollOffsets = (): void => {
  scrollOffsetsByPath.clear()
  lastNavigationTarget = ''
  isHandlingPopState = false
}
