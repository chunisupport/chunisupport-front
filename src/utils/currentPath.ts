type PathParts = {
  pathname: string
  search: string
  hash: string
}

export const buildCurrentPath = ({ pathname, search, hash }: PathParts): string =>
  `${pathname}${search}${hash}`
