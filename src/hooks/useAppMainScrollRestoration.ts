import { useBeforeLeave, useLocation } from '@solidjs/router'
import { type Accessor, createEffect, on, onCleanup } from 'solid-js'
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
  let didRestore = false
  /** `useBeforeLeave` で記録した離脱元パス。クリーンアップ時の保存キーに使う。 */
  let leavingPath: string | undefined

  /**
   * 離脱元のパスに対して現在のメインスクロール位置を保存する。
   *
   * @param fromPathname - 離脱元のパス名。未指定時はマウント時のパスへ保存する。
   */
  const saveCurrentOffset = (fromPathname?: string) => {
    saveAppMainScrollOffset(fromPathname ?? pathKey, getAppMainScrollTop())
  }

  useBeforeLeave((event) => {
    leavingPath = event.from.pathname
    saveCurrentOffset(event.from.pathname)
  })
  onCleanup(() => {
    saveCurrentOffset(leavingPath)
  })

  createEffect(() => {
    if (!isReady() || didRestore) return
    didRestore = true
    const currentOffset = resolveRestoredAppMainScrollOffset(
      getAppMainScrollOffset(location.pathname)
    )
    if (currentOffset <= 0) return

    queueMicrotask(() => {
      restoreAppMainScrollOffset(currentOffset)
      requestAnimationFrame(() => {
        restoreAppMainScrollOffset(currentOffset)
      })
    })
  })

  createEffect(
    on(
      () => location.pathname,
      (nextPath) => {
        if (!isReady()) return
        const nextOffset = resolveRestoredAppMainScrollOffset(getAppMainScrollOffset(nextPath))
        if (nextOffset <= 0) return

        queueMicrotask(() => {
          restoreAppMainScrollOffset(nextOffset)
          requestAnimationFrame(() => {
            restoreAppMainScrollOffset(nextOffset)
          })
        })
      },
      { defer: true }
    )
  )

  return restoredOffset
}
