const LOGIN_PATH = '/login'
const REGISTER_PATH = '/register'

const isPathMatch = (safePath: string, basePath: string): boolean => {
  const safePathname = new URL(safePath, 'https://app.local').pathname.replace(/\/$/, '')
  const basePathname = new URL(basePath, 'https://app.local').pathname.replace(/\/$/, '')
  return safePathname === basePathname
}

export const sanitizeRedirectPath = (rawPath: string | null | undefined): string | null => {
  if (!rawPath) return null
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) return null
  if (rawPath.includes('\\')) return null

  try {
    const parsed = new URL(rawPath, 'https://app.local')
    if (parsed.origin !== 'https://app.local') return null
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

  if (isPathMatch(safePath, LOGIN_PATH) || isPathMatch(safePath, REGISTER_PATH)) {
    return null
  }

  return safePath
}

export const buildLoginRedirectPath = (
  currentPath: string | null | undefined,
  baseLoginPath = LOGIN_PATH
): string => {
  const safeCurrentPath = sanitizeRedirectPath(currentPath)
  if (!safeCurrentPath || isPathMatch(safeCurrentPath, baseLoginPath) || isPathMatch(safeCurrentPath, REGISTER_PATH)) {
    return baseLoginPath
  }

  return `${baseLoginPath}?redirect=${encodeURIComponent(safeCurrentPath)}`
}
