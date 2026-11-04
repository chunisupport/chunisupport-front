import { signInWithPopup } from 'firebase/auth'

import { postLogin } from '../../api/auth'
import type { AuthProviderKind } from '../../constants/authProviders'
import { auth, createAuthProvider } from '../../lib/firebase'
import type { UserDTO } from '../../types/api'

/**
 * 指定した認証プロバイダのポップアップ認証と、バックエンドのログイン検証を順に実行する。
 *
 * @param kind - ログインに使う認証プロバイダの種類。
 * @param turnstileToken - Cloudflare Turnstileが発行した応答トークン。
 * @returns バックエンドでログインを検証したユーザー情報。
 */
export const loginWithProvider = async (
  kind: AuthProviderKind,
  turnstileToken: string
): Promise<UserDTO> => {
  await signInWithPopup(auth, createAuthProvider(kind))
  return postLogin({ turnstile_token: turnstileToken })
}
