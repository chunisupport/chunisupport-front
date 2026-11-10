import { auth } from '../../lib/firebase'
import { clearAuthenticatedUser } from '../../stores/authSession'
import { clearClientCache } from '../cache/clearClientCache'

/**
 * 退会やGoogleアカウント変更でログイン中のアカウントが使えなくなった後に、端末内のログイン状態とキャッシュを破棄する。
 * サーバー側の処理は完了しているため、サインアウトやキャッシュ削除に失敗しても例外を投げず、ログイン画面への遷移を止めない。
 *
 * @returns 破棄の試行完了後に解決されるPromise。拒否されることはない。
 */
export const discardLocalSession = async (): Promise<void> => {
  await auth.signOut().catch(() => undefined)
  await clearClientCache().catch(() => undefined)
  clearAuthenticatedUser()
}
