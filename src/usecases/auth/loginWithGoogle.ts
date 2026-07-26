import { signInWithPopup } from 'firebase/auth'

import { postLogin } from '../../api/auth'
import { auth, googleProvider } from '../../lib/firebase'
import type { UserDTO } from '../../types/api'

/**
 * Googleポップアップ認証とバックエンドのログイン検証を順に実行する。
 *
 * @param turnstileToken - Cloudflare Turnstileが発行した応答トークン。
 * @returns バックエンドでログインを検証したユーザー情報。
 */
export const loginWithGoogle = async (turnstileToken: string): Promise<UserDTO> => {
  await signInWithPopup(auth, googleProvider)
  return postLogin({ turnstile_token: turnstileToken })
}
