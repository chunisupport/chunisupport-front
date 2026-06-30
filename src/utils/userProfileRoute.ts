export const DEFAULT_PROFILE_PAGE_QUERY = 'rating_best' as const

export const profilePageQueryValues = [
  'rating_best',
  'rating_new',
  'record_normal',
  'record_we',
  'overpower',
] as const

export type ProfilePageQuery = (typeof profilePageQueryValues)[number]

export const overPowerSubPageValues = ['genre', 'diff', 'level', 'version'] as const

export type OverPowerSubPage = (typeof overPowerSubPageValues)[number]

const profilePageQuerySet = new Set<string>(profilePageQueryValues)
const overPowerSubPageSet = new Set<string>(overPowerSubPageValues)

const resolveSingleProfilePageQuery = (value: string | string[] | undefined): string | undefined =>
  typeof value === 'string' && profilePageQuerySet.has(value) ? value : undefined

/**
 * OVER POWER配下のパスパラメータを有効なサブページへ解決する。
 *
 * @param subPagePathParam - URLから取得したサブページのパスパラメータ。
 * @returns 有効なOVER POWERサブページ。無効値の場合はジャンル別ページ。
 */
export const resolveOverPowerSubPage = (
  subPagePathParam: string | string[] | undefined
): OverPowerSubPage =>
  typeof subPagePathParam === 'string' && overPowerSubPageSet.has(subPagePathParam)
    ? (subPagePathParam as OverPowerSubPage)
    : 'genre'

/**
 * ユーザーページのパスパラメータと旧クエリパラメータから表示タブを解決する。
 *
 * @param pagePathParam - URLから取得したページのパスパラメータ。
 * @param pageQueryParam - 互換用に読む旧pageクエリパラメータ。
 * @returns 有効なユーザーページ種別。無効値の場合は既定ページ。
 */
export const resolveProfilePageQuery = (
  pagePathParam: string | string[] | undefined,
  pageQueryParam?: string | string[] | undefined
): ProfilePageQuery => {
  const fromPath = resolveSingleProfilePageQuery(pagePathParam)
  if (fromPath) {
    return fromPath as ProfilePageQuery
  }

  const fromQuery = resolveSingleProfilePageQuery(pageQueryParam)
  if (fromQuery) {
    return fromQuery as ProfilePageQuery
  }

  return DEFAULT_PROFILE_PAGE_QUERY
}

/**
 * ユーザーページの指定がレコード系ページかどうかを判定する。
 *
 * @param pagePathParam - URLから取得したページのパスパラメータ。
 * @param pageQueryParam - 互換用に読む旧pageクエリパラメータ。
 * @returns 通常またはWORLD'S ENDレコードページならtrue。
 */
export const isRecordPageQuery = (
  pagePathParam: string | string[] | undefined,
  pageQueryParam?: string | string[] | undefined
): boolean => {
  const resolvedPage = resolveProfilePageQuery(pagePathParam, pageQueryParam)
  return resolvedPage === 'record_normal' || resolvedPage === 'record_we'
}

/**
 * ユーザーページの内部リンク用パスを生成する。
 *
 * @param username - パスへ埋め込むユーザー名。
 * @param page - 遷移先のユーザーページ種別。
 * @returns ユーザー名をエンコード済みのページパス。
 */
export const buildUserProfilePagePath = (username: string, page: ProfilePageQuery): string => {
  const encodedUsername = encodeURIComponent(username)
  if (page === DEFAULT_PROFILE_PAGE_QUERY) {
    return `/users/${encodedUsername}`
  }

  return `/users/${encodedUsername}/${page}`
}

/**
 * OVER POWERサブページの内部リンク用パスを生成する。
 *
 * @param username - パスへ埋め込むユーザー名。
 * @param subPage - 遷移先のOVER POWERサブページ。
 * @returns ユーザー名をエンコード済みのOVER POWERサブページパス。
 */
export const buildUserOverPowerPagePath = (username: string, subPage: OverPowerSubPage): string =>
  `${buildUserProfilePagePath(username, 'overpower')}/${subPage}`
