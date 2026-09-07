import { useBeforeLeave, useLocation } from '@solidjs/router'
import { type Accessor, createEffect, createMemo, onCleanup } from 'solid-js'
import {
  getAppMainScrollOffset,
  getAppMainScrollTop,
  rememberAppMainScrollNavigationTarget,
  resolveRestoredAppMainScrollOffset,
  restoreAppMainScrollOffset,
  saveAppMainScrollOffset,
} from '../utils/appMainScrollRestoration'

/**
 * 直近の遷移が履歴の戻る/進むかどうかを記録する。
 * 一覧スクロール復元を pop 時に限定するため、ルーター配下で常時呼び出す。
 */
export const useRememberAppMainScrollNavigationType = (): void => {
  useBeforeLeave((event) => {
    rememberAppMainScrollNavigationTarget(event.to)
  })
}

/**
 * 離脱前の `#app-main` スクロール位置を、履歴の戻る/進むで同一パスへ戻ったときに復元する。
 * 同一マウント内でのパス変更（ユーザーページのタブ切替など）で pop 戻りした場合も復元する。
 *
 * @param isReady - 復元対象のコンテンツが描画済みなら true。
 * @returns 仮想リストの初回オフセットへ渡す保存済み位置。新規遷移や未保存なら 0。
 */
export const useAppMainScrollRestoration = (isReady: Accessor<boolean>): number => {
  const location = useLocation()
  const pathKey = location.pathname
  const restoredOffset = resolveRestoredAppMainScrollOffset(getAppMainScrollOffset(pathKey))
  let savedBeforeLeave = false

  useBeforeLeave((event) => {
    saveAppMainScrollOffset(event.from.pathname, getAppMainScrollTop())
    savedBeforeLeave = true
  })
  onCleanup(() => {
    // 離脱前に保存済みなら、DOM破棄で縮んだ位置による上書きを防ぐ。
    if (!savedBeforeLeave) {
      saveAppMainScrollOffset(location.pathname, getAppMainScrollTop())
    }
  })

  createAppMainScrollRestoreEffect(() => location.pathname, isReady)
  return restoredOffset
}

/**
 * パスごとの履歴復元を、表示準備が整うまで保留する。
 *
 * @param pathname - 現在のパス。
 * @param isReady - 対象のコンテンツと仮想テーブルが描画済みなら true。
 * @returns なし。
 */
export const createAppMainScrollRestoreEffect = (
  pathname: Accessor<string>,
  isReady: Accessor<boolean>
): void => {
  const navigation = createMemo(() => ({
    offset: resolveRestoredAppMainScrollOffset(getAppMainScrollOffset(pathname())),
    restored: false,
  }))

  createEffect(() => {
    const current = navigation()
    const offset = resolveRestoredAppMainScrollOffset(getAppMainScrollOffset(pathname()))
    if (!isReady() || current.restored || offset <= 0) return
    let cancelled = false
    let frameId: number | undefined

    queueMicrotask(() => {
      if (cancelled) return
      restoreAppMainScrollOffset(offset)
      frameId = requestAnimationFrame(() => {
        restoreAppMainScrollOffset(offset)
        current.restored = true
      })
    })

    onCleanup(() => {
      cancelled = true
      if (frameId !== undefined) cancelAnimationFrame(frameId)
    })
  })
}
