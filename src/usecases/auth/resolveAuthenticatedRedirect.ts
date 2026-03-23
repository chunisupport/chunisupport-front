import type { UserDTO } from '../../types/api.ts'

type FetchUserProfile = (username: string) => Promise<unknown>

export const resolveAuthenticatedRedirect = async (
  user: UserDTO | null,
  fetchUserProfile: FetchUserProfile
): Promise<string | null> => {
  if (!user) {
    return null
  }

  try {
    await fetchUserProfile(user.username)
    return `/users/${encodeURIComponent(user.username)}`
  } catch (error) {
    const apiError = error as Error & { code?: string }
    if (apiError.code === 'user_not_found') {
      return '/register-score-temp'
    }

    throw error
  }
}
