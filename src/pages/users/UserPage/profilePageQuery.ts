export const DEFAULT_PROFILE_PAGE_QUERY = 'rating_best' as const

export const profilePageQueryValues = [
  'rating_best',
  'rating_new',
  'record_normal',
  'record_we',
  'overpower',
] as const

export type ProfilePageQuery = (typeof profilePageQueryValues)[number]

const profilePageQuerySet = new Set<string>(profilePageQueryValues)

export const resolveProfilePageQuery = (
  page: string | string[] | undefined
): ProfilePageQuery => {
  const normalizedPage = typeof page === 'string' ? page : undefined

  if (!normalizedPage || !profilePageQuerySet.has(normalizedPage)) {
    return DEFAULT_PROFILE_PAGE_QUERY
  }

  return normalizedPage as ProfilePageQuery
}

export const isRecordPageQuery = (page: string | string[] | undefined): boolean => {
  const resolvedPage = resolveProfilePageQuery(page)
  return resolvedPage === 'record_normal' || resolvedPage === 'record_we'
}
