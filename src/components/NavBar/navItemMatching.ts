import { profilePageQueryValues } from '../../pages/users/UserPage/profilePageQuery.ts'

export const homePathPattern = new RegExp(
  '^/users/[^/]+(?:/(' + profilePageQueryValues.join('|') + '))?$'
)

export const isHomePath = (pathname: string): boolean => homePathPattern.test(pathname)
