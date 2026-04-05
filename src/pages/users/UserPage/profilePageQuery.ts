export const DEFAULT_PROFILE_PAGE_QUERY = 'rating_best' as const

export const profilePageQueryValues = [
  'rating_best',
  'rating_new',
  'record_normal',
  'record_we',
] as const

export type ProfilePageQuery = (typeof profilePageQueryValues)[number]

const profilePageQuerySet = new Set<string>(profilePageQueryValues)

export const resolveProfilePageQuery = (page: string | undefined): ProfilePageQuery => {
  if (!page || !profilePageQuerySet.has(page)) {
    return DEFAULT_PROFILE_PAGE_QUERY
  }

  return page as ProfilePageQuery
}

export const isRecordPageQuery = (page: string | undefined): boolean => {
  const resolvedPage = resolveProfilePageQuery(page)
  return resolvedPage === 'record_normal' || resolvedPage === 'record_we'
}
