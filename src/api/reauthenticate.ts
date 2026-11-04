import { reauthenticateWithPopup } from 'firebase/auth'
import { auth, createAuthProvider } from '../lib/firebase'
import { findLinkedAuthAccount, resolveReauthProviderKind } from '../usecases/auth/authProviders'

/**
 * ログイン中のアカウントで再認証し、直後のIDトークンを取得する。
 * 連携済みの認証プロバイダで再認証し、別アカウントを選ぶと Firebase が
 * `auth/user-mismatch` で拒否する。Google ではログイン中のメールアドレスを事前選択させる。
 *
 * @returns 再認証直後のIDトークン。
 */
export const reauthenticateAndGetToken = async (): Promise<string> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('ログインしていません。再度ログインしてください。')
  }

  // X で登録して Google を後から連携した場合、ユーザー全体のメールは Google のものとは限らない。
  const provider = createAuthProvider(resolveReauthProviderKind(user.providerData), {
    loginHint: findLinkedAuthAccount(user.providerData, 'google')?.email ?? undefined,
  })
  const result = await reauthenticateWithPopup(user, provider)
  const token = await result.user.getIdToken(true)
  return token
}
