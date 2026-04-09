import type { ProfilePageQuery } from './profilePageQuery'

const hiddenScrollToTopPages: ReadonlySet<ProfilePageQuery> = new Set(['rating_best', 'rating_new'])

export const shouldShowProfileScrollToTop = (selectedPage: ProfilePageQuery): boolean =>
  !hiddenScrollToTopPages.has(selectedPage)
