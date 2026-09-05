import { useBeforeLeave, useLocation } from '@solidjs/router'
import { type Accessor, createEffect, onCleanup } from 'solid-js'
import {
  getAppMainScrollOffset,
  getAppMainScrollTop,
  restoreAppMainScrollOffset,
  saveAppMainScrollOffset,
} from '../utils/appMainScrollRestoration'

/**
 * 離脱前の `#app-main` スクロール位置を、同一パスへの再表示時に復元する。
 *
 * @param isReady - 復元対象のコンテンツが描画済みなら true。
 * @returns 仮想リストの初回オフセットへ渡す保存済み位置。未保存なら 0。
 */
export const useAppMainScrollRestoration = (isReady: Accessor<boolean>): number => {
  const location = useLocation()
  const pathKey = location.pathname
  const restoredOffset = getAppMainScrollOffset(pathKey) ?? 0
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
