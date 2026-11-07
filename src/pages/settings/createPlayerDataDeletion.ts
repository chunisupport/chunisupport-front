import { type Accessor, createSignal } from 'solid-js'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { PLAYER_DATA_DELETE_COPY } from './PlayerDataSettings.constants.ts'

type PlayerDataDeletionOptions = {
  /** 確認入力と照合するログイン中のユーザーネーム。未取得の間は undefined */
  username: Accessor<string | undefined>
  /** プレイヤーデータを削除する */
  deletePlayerData: () => Promise<void>
  /** 削除後に、プレイヤーデータに依存する表示を取得し直す */
  onDeleted: () => Promise<unknown>
}

/**
 * プレイヤーデータ削除の確認ダイアログと、削除中・成功・失敗の表示状態を管理する。
 * 画面を開いたままの誤操作で削除されないよう、確認入力が自分のユーザーネームと一致するまで削除しない。
 * 失敗時のエラーは確認ダイアログの中だけに表示するため、ダイアログを閉じると消す。
 *
 * @param options - 照合するユーザーネームと、削除・削除後の再取得の処理。
 * @returns ダイアログの開閉状態、確認入力、削除中か、成功・失敗の文言、および操作関数。
 */
export const createPlayerDataDeletion = (options: PlayerDataDeletionOptions) => {
  const [dialogOpen, setDialogOpenSignal] = createSignal(false)
  const [confirmInput, setConfirmInput] = createSignal('')
  const [deleting, setDeleting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')

  /**
   * 確認入力が自分のユーザーネームと一致しているかを返す。
   *
   * @returns 一致している場合は true。
   */
  const isConfirmed = (): boolean => {
    const username = options.username()
    return Boolean(username) && confirmInput() === username
  }

  /**
   * 確認ダイアログの開閉を反映する。閉じたときは前回のエラーを持ち越さない。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setDialogOpen = (open: boolean): void => {
    setDialogOpenSignal(open)
    if (!open) setError('')
  }

  /**
   * 確認入力と前回のエラーを空にして、確認ダイアログを開く。
   *
   * @returns なし。
   */
  const openDialog = (): void => {
    setConfirmInput('')
    setError('')
    setDialogOpenSignal(true)
  }

  /**
   * 確認ダイアログからプレイヤーデータを削除する。
   * 確認入力が一致しない場合や削除中に重ねて呼ばれた場合は何もしない。
   * 成功時はダイアログを閉じて成功文言を出し、失敗時はダイアログを開いたまま失敗文言を出す。
   *
   * @returns 削除と成功時の再取得が完了した後に解決されるPromise。
   */
  const submit = async (): Promise<void> => {
    if (deleting() || !isConfirmed()) return

    setError('')
    setSuccess('')
    setDeleting(true)
    try {
      await options.deletePlayerData()
    } catch (caught) {
      setError(toUserFriendlyErrorMessage(caught, PLAYER_DATA_DELETE_COPY.failure))
      return
    } finally {
      setDeleting(false)
    }

    setDialogOpen(false)
    setSuccess(PLAYER_DATA_DELETE_COPY.success)
    // 削除自体は完了しているため、再取得に失敗しても成功として扱う。
    await options.onDeleted().catch(() => undefined)
  }

  return {
    dialogOpen,
    setDialogOpen,
    openDialog,
    confirmInput,
    setConfirmInput,
    isConfirmed,
    deleting,
    error,
    success,
    submit,
  }
}
