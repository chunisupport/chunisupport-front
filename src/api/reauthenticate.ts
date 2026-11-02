import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

/**
 * ログイン中のアカウントでGoogle再認証し、直後のIDトークンを取得する。
 * 別アカウントを選ぶと Firebase が `auth/user-mismatch` で拒否するため、
 * ログイン中のメールアドレスをアカウント選択画面で事前選択させる。
 *
 * @returns 再認証直後のIDトークン。
 */
export const reauthenticateAndGetToken = async (): Promise<string> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('ログインしていません。再度ログインしてください。')
  }

  const provider = new GoogleAuthProvider()
  if (user.email) provider.setCustomParameters({ login_hint: user.email })
  const result = await reauthenticateWithPopup(user, provider)
  const token = await result.user.getIdToken(true)
  return token
}
