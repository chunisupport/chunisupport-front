const LOGIN_PATH = '/login'

const hasBlockedPrefix = (value: string): boolean => {
  const lower = value.toLowerCase()
  return (
    lower.startsWith('//') ||
    lower.startsWith('/\\') ||
    lower.startsWith('/%5c') ||
    lower.startsWith('/%2f%2f')
  )
}

export const sanitizeRedirectPath = (rawPath: string | null | undefined): string | null => {
  if (!rawPath) return null
  if (!rawPath.startsWith('/')) return null
  if (hasBlockedPrefix(rawPath)) return null
  if (rawPath.includes('\\')) return null

  try {
    const parsed = new URL(rawPath, 'https://app.local')
    if (parsed.origin !== 'https://app.local') return null
    if (!parsed.pathname.startsWith('/')) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export const resolvePostLoginRedirectPath = (
  redirectPath: string | null | undefined
): string | null => {
  const safePath = sanitizeRedirectPath(redirectPath)
  if (!safePath) return null

  const isExactPathOrWithQueryOrHash = (basePath: string): boolean =>
    safePath === basePath ||
    safePath.startsWith(`${basePath}?`) ||
    safePath.startsWith(`${basePath}#`)

  if (isExactPathOrWithQueryOrHash(LOGIN_PATH) || isExactPathOrWithQueryOrHash('/register')) {
    return null
  }
  return safePath
}

export const buildLoginRedirectPath = (
  currentPath: string | null | undefined,
  baseLoginPath = LOGIN_PATH
): string => {
  const safeCurrentPath = sanitizeRedirectPath(currentPath)
  if (
    !safeCurrentPath ||
    safeCurrentPath === baseLoginPath ||
    safeCurrentPath.startsWith(`${baseLoginPath}?`) ||
    safeCurrentPath.startsWith(`${baseLoginPath}#`)
  ) {
    return baseLoginPath
  }

  return `${baseLoginPath}?redirect=${encodeURIComponent(safeCurrentPath)}`
}
