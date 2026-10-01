import { signInWithEmailAndPassword } from 'firebase/auth'

import { postLogin } from '../../api/auth'
import { auth } from '../../lib/firebase'
import type { UserDTO } from '../../types/api'

/**
 * メール・パスワード認証とバックエンドのログイン検証を順に実行する。
 *
 * @param email - Firebaseに登録されたメールアドレス。
 * @param password - アカウントのパスワード。
 * @param turnstileToken - Cloudflare Turnstileの応答トークン。
 * @returns バックエンドでログインを検証したユーザー情報。
 */
export const loginWithPassword = async (
  email: string,
  password: string,
  turnstileToken: string
): Promise<UserDTO> => {
  await signInWithEmailAndPassword(auth, email.trim(), password)
  return postLogin({ turnstile_token: turnstileToken })
}
