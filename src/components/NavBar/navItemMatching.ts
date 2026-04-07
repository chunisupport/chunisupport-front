export const homePathPattern =
  /^\/users\/[^/]+(?:\/(rating_best|rating_new|record_normal|record_we|overpower))?$/

export const isHomePath = (pathname: string): boolean => homePathPattern.test(pathname)
