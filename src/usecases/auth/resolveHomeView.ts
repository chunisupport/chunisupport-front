import type { UserDTO } from '../../types/api'

export type HomeView =
  | { type: 'loading' }
  | { type: 'guest' }
  | { type: 'authenticated'; username: string }

type Params = {
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated' | 'error'
  username: UserDTO['username'] | null
}

export const resolveHomeView = (params: Params): HomeView => {
  if (params.authStatus === 'authenticated' && params.username) {
    return { type: 'authenticated', username: params.username }
  }

  if (params.authStatus === 'unauthenticated' || params.authStatus === 'error') {
    return { type: 'guest' }
  }

  return { type: 'loading' }
}
