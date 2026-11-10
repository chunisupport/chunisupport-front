import { useLocation } from '@solidjs/router'
import { createEffect } from 'solid-js'
import { resolveRobotsMetaContent } from '../utils/robots'

const ROBOTS_META_NAME = 'robots'

/**
 * 現在の robots メタタグ content を取得する。
 *
 * @returns robots content。未設定時は null。
 */
const readRobotsMetaContent = (): string | null =>
  document.head.querySelector(`meta[name="${ROBOTS_META_NAME}"]`)?.getAttribute('content') ?? null

/**
 * robots メタタグを指定 content へ同期する。null のときはタグを削除する。
 *
 * @param content - 設定する robots content。削除する場合は null。
 */
const applyRobotsMetaContent = (content: string | null) => {
  const existing = document.head.querySelector(`meta[name="${ROBOTS_META_NAME}"]`)
  if (content === null) {
    existing?.remove()
    return
  }

  if (existing) {
    existing.setAttribute('content', content)
    return
  }

  const meta = document.createElement('meta')
  meta.setAttribute('name', ROBOTS_META_NAME)
  meta.setAttribute('content', content)
  document.head.appendChild(meta)
}

let initialRobotsMetaContent: string | null | undefined

/**
 * 現在パスに応じて robots メタタグを更新する。
 * ユーザーページは noindex にし、サイト全体の noindex は解除しない。
 */
export const useRobotsMeta = () => {
  const location = useLocation()

  createEffect(() => {
    if (initialRobotsMetaContent === undefined) {
      initialRobotsMetaContent = readRobotsMetaContent()
    }

    applyRobotsMetaContent(resolveRobotsMetaContent(location.pathname, initialRobotsMetaContent))
  })
}
