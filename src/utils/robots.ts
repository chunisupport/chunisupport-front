import { USERS_PATH } from '../constants/routes'
import { normalizeRoutePathname } from './routePathname'

/** robots メタタグへ設定する noindex 値 */
export const ROBOTS_NOINDEX_CONTENT = 'noindex'

/**
 * robots コンテンツに noindex が含まれているか判定する。
 *
 * @param content - robots メタタグの content。未設定時は null。
 * @returns noindex を含む場合は true。
 */
const hasNoindexDirective = (content: string | null): boolean =>
  content?.toLowerCase().includes(ROBOTS_NOINDEX_CONTENT) ?? false

/**
 * 検索エンジンへインデックスさせないパスか判定する。
 *
 * @param pathname - ブラウザーの現在パス。
 * @returns ユーザーページの場合は true。
 */
export const isNoindexPathname = (pathname: string): boolean => {
  const normalized = normalizeRoutePathname(pathname)
  return normalized === USERS_PATH || normalized.startsWith(`${USERS_PATH}/`)
}

/**
 * 現在パスと初期 robots 値から、設定すべき robots content を決める。
 * サイト全体の noindex は解除せず、ユーザーページだけ追加で noindex にする。
 *
 * @param pathname - ブラウザーの現在パス。
 * @param initialRobotsContent - HTML 初期状態の robots content。未設定時は null。
 * @returns 設定する robots content。タグを外す場合は null。
 */
export const resolveRobotsMetaContent = (
  pathname: string,
  initialRobotsContent: string | null
): string | null => {
  if (hasNoindexDirective(initialRobotsContent) || isNoindexPathname(pathname)) {
    return initialRobotsContent ?? ROBOTS_NOINDEX_CONTENT
  }

  return initialRobotsContent
}
