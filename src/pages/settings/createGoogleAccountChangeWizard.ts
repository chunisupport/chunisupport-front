import { createSignal, onCleanup } from 'solid-js'
import type { GoogleAccountChangeTarget } from '../../usecases/auth/changeGoogleAccount'
import { isAuthPopupClosedError, toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  GOOGLE_ACCOUNT_CHANGE_COPY,
  GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES,
} from './AccountSettings.constants.ts'

/** ウィザードの各ステップ */
export type GoogleAccountChangeStep = keyof typeof GOOGLE_ACCOUNT_CHANGE_COPY.steps

/** 本人確認で、ログイン中とは別のアカウントが選ばれたことを表すエラーコード */
const REAUTH_MISMATCH_ERROR_CODES: ReadonlySet<string> = new Set([
  'auth/user-mismatch',
  'invalid_credentials',
])

type GoogleAccountChangeWizardOptions = {
  /** ログイン中のユーザーに連携されたGoogleアカウントのメールアドレスを取得する */
  getCurrentEmail: () => string
  /** 変更先のGoogleアカウントを選択してサインインする */
  selectTarget: () => Promise<GoogleAccountChangeTarget>
  /** 選択済みの変更先アカウントのサインイン状態を破棄する */
  cancelChange: () => Promise<void>
  /** 再認証して変更先へ差し替える。ログイン中のセッションを切り替えられた場合は true を返す */
  changeAccount: (target: GoogleAccountChangeTarget) => Promise<boolean>
  /** 差し替え後にセッションを切り替えられず、旧アカウントでのログイン状態が失われた場合の処理 */
  onSessionLost: () => Promise<void>
}

/**
 * Googleアカウント変更ウィザードの進行と、選択中・変更中・エラーの表示状態を管理する。
 * 本人確認をやり直せるエラーは本人確認ダイアログに、変更先を選び直す必要があるエラーはウィザード本体に表示する。
 * 破棄されたときは、選択済みの変更先アカウントのサインイン状態を残さない。
 *
 * @param options - 現在のメールアドレスの取得と、選択・取り消し・変更・セッション喪失時の処理。
 * @returns ウィザードの状態と操作関数。
 */
export const createGoogleAccountChangeWizard = (options: GoogleAccountChangeWizardOptions) => {
  const [currentEmail, setCurrentEmail] = createSignal(options.getCurrentEmail())
  const [isOpen, setIsOpen] = createSignal(false)
  const [isReauthOpen, setIsReauthOpen] = createSignal(false)
  const [target, setTarget] = createSignal<GoogleAccountChangeTarget>()
  const [isDone, setIsDone] = createSignal(false)
  const [isSelecting, setIsSelecting] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [reauthError, setReauthError] = createSignal('')

  /**
   * 現在のステップを返す。
   *
   * @returns 完了済みなら `done`、変更先を選択済みなら `confirm`、それ以外は `select`。
   */
  const step = (): GoogleAccountChangeStep => {
    if (isDone()) return 'done'
    return target() ? 'confirm' : 'select'
  }

  /**
   * 認証のポップアップを開いている最中かを返す。
   *
   * @returns 変更先の選択中または変更中の場合は true。
   */
  const isBusy = (): boolean => isSelecting() || isSubmitting()

  /**
   * 選択済みの変更先アカウントのサインイン状態を破棄する。失敗しても画面の操作は止めない。
   *
   * @returns 破棄の試行完了後に解決されるPromise。
   */
  const cancelSelectedTarget = (): Promise<void> => options.cancelChange().catch(() => undefined)

  onCleanup(() => {
    void cancelSelectedTarget()
  })

  /**
   * ウィザードの開閉要求を処理する。
   * ポップアップでの認証中は閉じさせず、閉じたときは途中の状態と変更先のサインイン状態を破棄する。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setOpen = (open: boolean): void => {
    if (!open && isBusy()) return
    setIsOpen(open)
    if (open) return
    setIsReauthOpen(false)
    setTarget(undefined)
    setIsDone(false)
    setError('')
    setReauthError('')
    void cancelSelectedTarget()
  }

  /**
   * 本人確認ダイアログの開閉要求を処理する。再認証中は閉じさせない。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setReauthOpen = (open: boolean): void => {
    if (!open && isSubmitting()) return
    setIsReauthOpen(open)
    setReauthError('')
  }

  /**
   * 変更先のGoogleアカウントを選択する。選択済みの場合は選び直しになる。
   * 認証中に重ねて呼ばれた場合は何もしない。
   * 変更できないアカウントが選ばれた場合は、選択をなかったことにして変更先を空欄へ戻す。
   *
   * @returns 選択処理完了後に解決されるPromise。
   */
  const select = async (): Promise<void> => {
    if (isBusy()) return

    setError('')
    setIsSelecting(true)
    try {
      setTarget(await options.selectTarget())
    } catch (caught) {
      // 選び直しを途中でやめただけなら、エラーは出さず選択済みの変更先もそのまま残す。
      if (isAuthPopupClosedError(caught)) return
      setTarget(undefined)
      setError(toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure))
      await cancelSelectedTarget()
    } finally {
      setIsSelecting(false)
    }
  }

  /**
   * 本人確認ダイアログを開く。
   *
   * @returns なし。
   */
  const proceed = (): void => {
    setError('')
    setReauthOpen(true)
  }

  /**
   * 現在のアカウントで再認証し、変更先アカウントへ差し替える。変更中に重ねて呼ばれた場合は何もしない。
   * セッションを変更先へ切り替えられなかった場合は、旧アカウントでのログイン状態の喪失として扱う。
   *
   * @returns 変更処理完了後に解決されるPromise。
   */
  const submit = async (): Promise<void> => {
    const selectedTarget = target()
    if (!selectedTarget || isSubmitting()) return

    setReauthError('')
    setIsSubmitting(true)
    try {
      const sessionSwitched = await options.changeAccount(selectedTarget)
      if (!sessionSwitched) {
        // 旧アカウントは削除済みのため、変更先でログインし直してもらう。
        await options.onSessionLost()
        return
      }
      setIsReauthOpen(false)
      setCurrentEmail(options.getCurrentEmail() || selectedTarget.email)
      setIsDone(true)
      // 変更先の認証情報は使用済みのため、保持し続けない。
      setTarget(undefined)
    } catch (caught) {
      const code = (caught as { code?: unknown } | null)?.code
      if (typeof code === 'string' && GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES.has(code)) {
        setIsReauthOpen(false)
        setTarget(undefined)
        setError(
          code === 'recent_sign_in_required'
            ? GOOGLE_ACCOUNT_CHANGE_COPY.recentSignInExpired
            : toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure)
        )
        await cancelSelectedTarget()
        return
      }
      // 本人確認のポップアップを自分で閉じただけなら、エラーとして扱わない。
      if (isAuthPopupClosedError(caught)) return
      setReauthError(
        typeof code === 'string' && REAUTH_MISMATCH_ERROR_CODES.has(code)
          ? GOOGLE_ACCOUNT_CHANGE_COPY.userMismatch(currentEmail())
          : toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    currentEmail,
    isOpen,
    setOpen,
    isReauthOpen,
    setReauthOpen,
    target,
    step,
    isSelecting,
    isSubmitting,
    isBusy,
    error,
    reauthError,
    select,
    proceed,
    submit,
  }
}
