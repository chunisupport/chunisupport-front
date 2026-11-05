import { reauthenticateWithPopup } from 'firebase/auth'
import { auth, createAuthProvider } from '../lib/firebase'
import { findLinkedAuthAccount, resolveReauthProviderKind } from '../usecases/auth/authProviders'
import { syncXAccountFromResult } from '../usecases/auth/syncXAccount'

/**
 * ログイン中のアカウントで再認証し、直後のIDトークンを取得する。
 * 連携済みの認証プロバイダで再認証し、別アカウントを選ぶと Firebase が
 * `auth/user-mismatch` で拒否する。Google ではログイン中のメールアドレスを事前選択させる。
 * X で再認証した場合は、X のトークンを得られる機会なので @ID の取得し直しを裏で行う。
 *
 * @param options - 再認証の挙動を調整するオプション。
 * @param options.skipXAccountSync - 退会のように直後にアカウントが消える操作で、@ID の取得し直しを省く場合は true。
 * @returns 再認証直後のIDトークン。
 */
export const reauthenticateAndGetToken = async (
  options: { skipXAccountSync?: boolean } = {}
): Promise<string> => {
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
  if (!options.skipXAccountSync) void syncXAccountFromResult(result)
  return token
}
