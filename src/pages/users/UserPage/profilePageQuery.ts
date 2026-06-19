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

export const resolveOverPowerSubPage = (
  subPagePathParam: string | string[] | undefined
): OverPowerSubPage =>
  typeof subPagePathParam === 'string' && overPowerSubPageSet.has(subPagePathParam)
    ? (subPagePathParam as OverPowerSubPage)
    : 'genre'

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

export const isRecordPageQuery = (
  pagePathParam: string | string[] | undefined,
  pageQueryParam?: string | string[] | undefined
): boolean => {
  const resolvedPage = resolveProfilePageQuery(pagePathParam, pageQueryParam)
  return resolvedPage === 'record_normal' || resolvedPage === 'record_we'
}

export const buildUserProfilePagePath = (username: string, page: ProfilePageQuery): string => {
  const encodedUsername = encodeURIComponent(username)
  if (page === DEFAULT_PROFILE_PAGE_QUERY) {
    return `/users/${encodedUsername}`
  }

  return `/users/${encodedUsername}/${page}`
}

export const buildUserOverPowerPagePath = (username: string, subPage: OverPowerSubPage): string =>
  `${buildUserProfilePagePath(username, 'overpower')}/${subPage}`
