import { overPowerSubPageValues, profilePageQueryValues } from '../../utils/userProfileRoute'

const profilePagePattern = profilePageQueryValues.filter((value) => value !== 'overpower').join('|')
const overPowerSubPagePattern = overPowerSubPageValues.join('|')

export const homePathPattern = new RegExp(
  `^/users/[^/]+(?:/(?:${profilePagePattern}|overpower(?:/(${overPowerSubPagePattern}))?))?$`
)

export const isHomePath = (pathname: string): boolean => homePathPattern.test(pathname)
