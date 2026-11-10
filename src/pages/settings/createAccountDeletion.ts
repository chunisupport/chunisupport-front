import { createSignal } from 'solid-js'
import { ACCOUNT_DELETE_COPY } from './AccountSettings.constants.ts'
import { resolveReauthErrorMessage } from './reauthErrorMessage'

type AccountDeletionOptions = {
  /** 再認証してからアカウントを削除する */
  deleteAccount: () => Promise<void>
  /** 退会後に端末内のログイン状態とキャッシュを破棄する。失敗しても拒否しない */
  discardSession: () => Promise<void>
  /** ログイン画面へ遷移する */
  navigateToLogin: () => void
}

/**
 * 退会の確認ダイアログと、処理中・失敗の表示状態を管理する。
 * 成功時はサインアウトしてログイン画面へ遷移し、失敗時のエラーは確認ダイアログの中だけに表示する。
 *
 * @param options - 退会、端末内のログイン状態の破棄、ログイン画面への遷移の処理。
 * @returns ダイアログの開閉状態、処理中か、エラー文言、および操作関数。
 */
export const createAccountDeletion = (options: AccountDeletionOptions) => {
  const [dialogOpen, setDialogOpenSignal] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)
  const [error, setError] = createSignal('')

  /**
   * 退会確認ダイアログの開閉を反映する。閉じたときは前回のエラーを持ち越さない。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setDialogOpen = (open: boolean): void => {
    setDialogOpenSignal(open)
    if (!open) setError('')
  }

  /**
   * 確認ダイアログから退会し、ログイン画面へ遷移する。処理中に重ねて呼ばれた場合は何もしない。
   * 再認証のポップアップを閉じただけの場合はエラーを表示しない。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const submit = async (): Promise<void> => {
    if (deleting()) return

    setError('')
    setDeleting(true)
    try {
      await options.deleteAccount()
      await options.discardSession()
      options.navigateToLogin()
    } catch (caught) {
      setError(resolveReauthErrorMessage(caught, ACCOUNT_DELETE_COPY) ?? '')
    } finally {
      setDeleting(false)
    }
  }

  return { dialogOpen, setDialogOpen, deleting, error, submit }
}
