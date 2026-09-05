import { useBeforeLeave, useLocation } from '@solidjs/router'
import { type Accessor, createEffect, onCleanup } from 'solid-js'
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
 *
 * @param isReady - 復元対象のコンテンツが描画済みなら true。
 * @returns 仮想リストの初回オフセットへ渡す保存済み位置。新規遷移や未保存なら 0。
 */
export const useAppMainScrollRestoration = (isReady: Accessor<boolean>): number => {
  const location = useLocation()
  const pathKey = location.pathname
  const restoredOffset = resolveRestoredAppMainScrollOffset(getAppMainScrollOffset(pathKey))
  let didRestore = false

  /**
   * 現在のメインスクロール位置を、この画面のパスへ保存する。
   */
  const saveCurrentOffset = () => {
    saveAppMainScrollOffset(pathKey, getAppMainScrollTop())
  }

  useBeforeLeave(saveCurrentOffset)
  onCleanup(saveCurrentOffset)

  createEffect(() => {
    if (!isReady() || didRestore) return
    didRestore = true
    if (restoredOffset <= 0) return

    queueMicrotask(() => {
      restoreAppMainScrollOffset(restoredOffset)
      requestAnimationFrame(() => {
        restoreAppMainScrollOffset(restoredOffset)
      })
    })
  })

  return restoredOffset
}
