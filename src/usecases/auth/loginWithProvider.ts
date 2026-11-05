import { signInWithPopup } from 'firebase/auth'

import { postLogin } from '../../api/auth'
import type { AuthProviderKind } from '../../constants/authProviders'
import { auth, createAuthProvider } from '../../lib/firebase'
import type { UserDTO } from '../../types/api'
import { holdXAuthResultForSignup, syncXAccountFromResult } from './syncXAccount'

/**
 * 指定した認証プロバイダのポップアップ認証と、バックエンドのログイン検証を順に実行する。
 * X でログインした場合は、ログイン後の画面遷移を待たせないよう @ID の取得し直しを裏で行う。
 * 未登録などでログイン検証に失敗した場合は、新規登録へ進むときのために認証結果を保持する。
 *
 * @param kind - ログインに使う認証プロバイダの種類。
 * @param turnstileToken - Cloudflare Turnstileが発行した応答トークン。
 * @returns バックエンドでログインを検証したユーザー情報。
 */
export const loginWithProvider = async (
  kind: AuthProviderKind,
  turnstileToken: string
): Promise<UserDTO> => {
  const result = await signInWithPopup(auth, createAuthProvider(kind))
  let user: UserDTO
  try {
    user = await postLogin({ turnstile_token: turnstileToken })
  } catch (error) {
    holdXAuthResultForSignup(result)
    throw error
  }
  void syncXAccountFromResult(result)
  return user
}
