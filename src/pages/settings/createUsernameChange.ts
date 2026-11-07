import { type Accessor, createSignal } from 'solid-js'
import { validateUsername } from '../../utils/usernameInput'
import { USERNAME_CHANGE_COPY } from './AccountSettings.constants.ts'
import { resolveReauthErrorMessage } from './reauthErrorMessage'

type UsernameChangeOptions = {
  /** 現在のユーザーネーム */
  currentUsername: Accessor<string>
  /** ログイン中のアカウントで再認証し、直後のIDトークンを取得する */
  reauthenticate: () => Promise<string>
  /** 再認証済みのIDトークンでユーザーネームを変更する */
  updateUsername: (username: string, reauthToken: string) => Promise<{ username: string }>
  /** 変更完了後に、APIが確定したユーザーネームを通知する */
  onChanged: (username: string) => void | Promise<void>
}

/**
 * ユーザーネーム入力の検証結果を設定画面向けの文言へ変換する。
 *
 * @param username - 入力中のユーザーネーム。
 * @param currentUsername - 現在のユーザーネーム。
 * @returns 入力エラー文言。有効な場合や未入力の場合は空文字。
 */
const validateUsernameChange = (username: string, currentUsername: string): string => {
  if (username.length === 0) return ''

  if (validateUsername(username) === 'invalid') return USERNAME_CHANGE_COPY.invalid
  if (username === currentUsername) return USERNAME_CHANGE_COPY.unchanged
  return ''
}

/**
 * 再認証を伴うユーザーネーム変更の入力と、変更中・成功・失敗の表示状態を管理する。
 * 入力不正や再認証のエラーは入力欄に表示し、再認証のポップアップを閉じただけの場合は表示しない。
 *
 * @param options - 現在のユーザーネームと、再認証・変更・変更完了通知の処理。
 * @returns 入力値、エラー・成功文言、変更中か、および操作関数。
 */
export const createUsernameChange = (options: UsernameChangeOptions) => {
  const [username, setUsernameSignal] = createSignal('')
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  /**
   * 入力を反映し、前回のエラーと成功文言を消す。
   *
   * @param value - 新しい入力値。
   * @returns なし。
   */
  const setUsername = (value: string): void => {
    setUsernameSignal(value)
    setError('')
    setSuccess('')
  }

  /**
   * 入力されたユーザーネームを検証し、結果を入力欄のエラーへ反映する。
   *
   * @returns 入力が有効な場合は true。
   */
  const validate = (): boolean => {
    const message = validateUsernameChange(username(), options.currentUsername())
    setError(message)
    return message.length === 0
  }

  /**
   * 再認証してからユーザーネームを変更し、確定値を通知する。
   * 未入力・入力不正の場合や変更中に重ねて呼ばれた場合は何もしない。
   *
   * @returns 変更処理完了後に解決されるPromise。
   */
  const submit = async (): Promise<void> => {
    if (submitting()) return

    setSuccess('')
    if (username().length === 0 || !validate()) return

    setSubmitting(true)
    try {
      const reauthToken = await options.reauthenticate()
      const result = await options.updateUsername(username(), reauthToken)
      await options.onChanged(result.username)
      setUsernameSignal('')
      setError('')
      setSuccess(USERNAME_CHANGE_COPY.success)
    } catch (caught) {
      setError(resolveReauthErrorMessage(caught, USERNAME_CHANGE_COPY) ?? '')
    } finally {
      setSubmitting(false)
    }
  }

  return { username, setUsername, error, success, submitting, validate, submit }
}
