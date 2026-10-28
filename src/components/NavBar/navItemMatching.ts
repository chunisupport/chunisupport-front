import { overPowerSubPageValues, profilePageQueryValues } from '../../utils/userProfileRoute'

const profilePagePattern = profilePageQueryValues.filter((value) => value !== 'overpower').join('|')
const overPowerSubPagePattern = overPowerSubPageValues.join('|')

export const homePathPattern = new RegExp(
  `^/users/[^/]+(?:/(?:${profilePagePattern}|overpower(?:/(${overPowerSubPagePattern}))?))?$`
)

const userPathSegmentPattern = /^\/users\/([^/]+)/

/**
 * ナビゲーション項目のアクティブ判定に使うパス情報。
 * @property id - 項目ID。ホームだけ専用のパス判定を使う。
 * @property path - 項目の遷移先パス。前方一致・完全一致の比較に使う。
 * @property matchPattern - 指定時はパス全体をこの正規表現で判定する。
 * @property matchPrefix - 指定時は path の前方一致で判定する。
 */
export type NavItemActiveTarget = {
  id: string
  path: string
  matchPattern?: RegExp
  matchPrefix?: boolean
}

/**
 * ユーザーパスのセグメントを1回だけデコードする。
 * 不正なパーセントエンコードは例外にせず null を返す。
 *
 * @param segment - `/users/` 直後のパスセグメント。
 * @returns デコードしたユーザー名。不正なエンコードの場合は null。
 */
const decodeUserPathSegment = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment)
  } catch (error) {
    if (error instanceof URIError) {
      return null
    }
    throw error
  }
}

export const isHomePath = (pathname: string): boolean => homePathPattern.test(pathname)

/**
 * ナビゲーション項目が現在のパスでアクティブかを判定する。
 *
 * ログイン中に他人のユーザーページを見ている場合は、どの項目もアクティブにしない。
 * ユーザー名のパーセントエンコードが不正な場合は例外を出さず、非アクティブにする。
 *
 * @param item - 判定対象のナビゲーション項目。
 * @param pathname - 現在のパス。
 * @param authUsername - ログイン中のユーザー名。未ログイン時は null または undefined。
 * @returns 項目をアクティブ表示するなら true。
 */
export const isNavItemActive = (
  item: NavItemActiveTarget,
  pathname: string,
  authUsername: string | null | undefined
): boolean => {
  const userMatch = pathname.match(userPathSegmentPattern)
  if (userMatch) {
    const viewedUsername = decodeUserPathSegment(userMatch[1])
    if (viewedUsername === null || (authUsername != null && viewedUsername !== authUsername)) {
      return false
    }
  }

  if (item.id === 'home') {
    return isHomePath(pathname)
  }
  if (item.matchPattern) {
    return item.matchPattern.test(pathname)
  }
  if (item.matchPrefix) {
    return pathname.startsWith(item.path)
  }
  return pathname === item.path
}
