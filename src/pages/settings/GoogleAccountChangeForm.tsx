import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { useNavigate } from '@solidjs/router'
import {
  ArrowDown,
  ArrowRightLeft,
  Check,
  CircleCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { AppDialogHeader } from '../../components/common/AppDialogHeader'
import { auth, getAccountChangeAuth } from '../../lib/firebase'
import { clearAuthenticatedUser } from '../../stores/authSession'
import {
  cancelGoogleAccountChange,
  changeGoogleAccount,
  type GoogleAccountChangeTarget,
  selectGoogleAccountChangeTarget,
} from '../../usecases/auth/changeGoogleAccount'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  GOOGLE_ACCOUNT_CHANGE_COPY,
  GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES,
} from './AccountSettings.constants'

/** ウィザードの各ステップ */
type WizardStep = keyof typeof GOOGLE_ACCOUNT_CHANGE_COPY.steps

const WIZARD_STEPS: readonly WizardStep[] = ['select', 'confirm', 'done']

/** ダイアログ下部のボタン配置 */
const DIALOG_FOOTER_CLASS = 'mt-5 flex shrink-0 flex-wrap justify-end gap-2'

/**
 * ウィザードの進行状況を表示する。
 *
 * @param props - 現在のステップ。
 * @returns ステップ表示。
 */
const WizardStepIndicator: Component<{ current: WizardStep }> = (props) => {
  const currentIndex = () => WIZARD_STEPS.indexOf(props.current)

  return (
    <ol aria-label={GOOGLE_ACCOUNT_CHANGE_COPY.stepsLabel} class="mt-4 flex gap-2 text-xs">
      <For each={WIZARD_STEPS}>
        {(wizardStep, index) => {
          const isDone = () => index() < currentIndex() || props.current === 'done'
          const isCurrent = () => index() === currentIndex()
          return (
            <li
              aria-current={isCurrent() ? 'step' : undefined}
              class="flex flex-1 flex-col items-center gap-1 border-t-2 pt-2 text-center"
              classList={{
                'border-action-primary text-text': isDone() || isCurrent(),
                'border-border text-text-muted': !isDone() && !isCurrent(),
                'font-semibold': isCurrent(),
              }}
            >
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full"
                classList={{
                  'bg-action-primary text-text-inverse': isDone() || isCurrent(),
                  'bg-surface-muted text-text-muted': !isDone() && !isCurrent(),
                }}
              >
                <Show when={isDone()} fallback={index() + 1}>
                  <Check aria-hidden="true" class="h-4 w-4" />
                </Show>
              </span>
              {GOOGLE_ACCOUNT_CHANGE_COPY.steps[wizardStep]}
              <Show when={isDone()}>
                <span class="sr-only">{GOOGLE_ACCOUNT_CHANGE_COPY.stepCompleted}</span>
              </Show>
            </li>
          )
        }}
      </For>
    </ol>
  )
}

/**
 * ログインに使うGoogleアカウントを変更するウィザードをダイアログで表示する。
 * 変更中にほかの操作をさせないよう、モーダルに閉じ込めて手順を一本道にする。
 * 「現在 → 変更先」を1枚に並べ、空欄の変更先をクリックしてアカウントを選ばせる。
 * 本人確認は別ダイアログで認証に使うアカウントを示してから始め、取り違えを防ぐ。
 * 各認証を別々のクリックで開始するのは、ポップアップがブロックされないようにするため。
 *
 * @returns Googleアカウント変更欄とウィザードダイアログ。
 */
export const GoogleAccountChangeForm: Component = () => {
  const navigate = useNavigate()
  const [currentEmail, setCurrentEmail] = createSignal(auth.currentUser?.email ?? '')
  const [isOpen, setIsOpen] = createSignal(false)
  const [isReauthOpen, setIsReauthOpen] = createSignal(false)
  const [target, setTarget] = createSignal<GoogleAccountChangeTarget>()
  const [isDone, setIsDone] = createSignal(false)
  const [isSelecting, setIsSelecting] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [reauthError, setReauthError] = createSignal('')
  let stepPanel: HTMLFieldSetElement | undefined

  const step = (): WizardStep => {
    if (isDone()) return 'done'
    return target() ? 'confirm' : 'select'
  }

  const isBusy = () => isSelecting() || isSubmitting()

  // Safari などではクリック後に初期化するとポップアップがブロックされるため、表示時に初期化しておく。
  onMount(() => {
    getAccountChangeAuth()
  })

  // 本人確認へ進むボタンは完了時やエラーでの選び直し時に消えるため、キーボード操作の位置を失わないようフォーカスを移す。
  // 変更先の枠は選択と確認のステップをまたいで残るため、確認ステップへ進むときは移さない。
  createEffect(
    on(
      step,
      (current) => {
        if (isOpen() && current !== 'confirm') stepPanel?.focus()
      },
      { defer: true }
    )
  )

  onCleanup(() => {
    void cancelGoogleAccountChange().catch(() => undefined)
  })

  /**
   * ダイアログの開閉要求を処理する。
   * ポップアップでの認証中は閉じさせず、閉じたときは途中の状態と変更先のサインイン状態を破棄する。
   *
   * @param open - ダイアログを開く場合は true。
   */
  const handleOpenChange = (open: boolean): void => {
    if (!open && isBusy()) return
    setIsOpen(open)
    if (open) return
    setIsReauthOpen(false)
    setTarget(undefined)
    setIsDone(false)
    setError('')
    setReauthError('')
    void cancelGoogleAccountChange().catch(() => undefined)
  }

  /**
   * 本人確認ダイアログの開閉要求を処理する。再認証中は閉じさせない。
   *
   * @param open - ダイアログを開く場合は true。
   */
  const handleReauthOpenChange = (open: boolean): void => {
    if (!open && isSubmitting()) return
    setIsReauthOpen(open)
    setReauthError('')
  }

  /**
   * 変更先のGoogleアカウントを選択する。選択済みの場合は選び直しになる。
   * 変更できないアカウントが選ばれた場合は、選択をなかったことにして変更先を空欄へ戻す。
   */
  const handleSelect = async (): Promise<void> => {
    setError('')
    setIsSelecting(true)
    try {
      setTarget(await selectGoogleAccountChangeTarget())
    } catch (caught) {
      const code = (caught as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') {
        // 選び直しを途中でやめただけなら、選択済みの変更先はそのまま残す。
        setError(GOOGLE_ACCOUNT_CHANGE_COPY.selectionClosed)
        return
      }
      setTarget(undefined)
      setError(toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure))
      await cancelGoogleAccountChange().catch(() => undefined)
    } finally {
      setIsSelecting(false)
    }
  }

  /** 本人確認ダイアログを開く。 */
  const handleProceed = (): void => {
    setError('')
    handleReauthOpenChange(true)
  }

  /**
   * 現在のアカウントで再認証し、変更先アカウントへ差し替える。
   * 本人確認をやり直せるエラーは本人確認ダイアログに、変更先を選び直す必要があるエラーはウィザードに表示する。
   */
  const handleSubmit = async (): Promise<void> => {
    const selectedTarget = target()
    if (!selectedTarget) return

    setReauthError('')
    setIsSubmitting(true)
    try {
      const sessionSwitched = await changeGoogleAccount(selectedTarget)
      if (!sessionSwitched) {
        // 旧アカウントは削除済みのため、変更先でログインし直してもらう。
        await auth.signOut().catch(() => undefined)
        await clearClientCache().catch(() => undefined)
        clearAuthenticatedUser()
        navigate('/login', { replace: true })
        return
      }
      setIsReauthOpen(false)
      setCurrentEmail(auth.currentUser?.email ?? selectedTarget.email)
      setIsDone(true)
      // 変更先の認証情報は使用済みのため、保持し続けない。
      setTarget(undefined)
    } catch (caught) {
      const code = (caught as { code?: string }).code
      if (code && GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES.has(code)) {
        setIsReauthOpen(false)
        setTarget(undefined)
        setError(
          code === 'recent_sign_in_required'
            ? GOOGLE_ACCOUNT_CHANGE_COPY.recentSignInExpired
            : toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure)
        )
        await cancelGoogleAccountChange().catch(() => undefined)
        return
      }
      if (code === 'auth/popup-closed-by-user') {
        setReauthError(GOOGLE_ACCOUNT_CHANGE_COPY.popupClosed)
      } else if (code === 'auth/user-mismatch' || code === 'invalid_credentials') {
        setReauthError(GOOGLE_ACCOUNT_CHANGE_COPY.userMismatch(currentEmail()))
      } else {
        setReauthError(toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="google-account-change-title"
      class="mt-10 border-t border-border pt-6"
    >
      <h3 id="google-account-change-title" class="flex items-center gap-2 font-semibold text-text">
        <ArrowRightLeft aria-hidden="true" class="h-5 w-5" />
        {GOOGLE_ACCOUNT_CHANGE_COPY.title}
      </h3>
      <dl class="mt-4 max-w-md text-sm">
        <div class="flex flex-wrap justify-between gap-x-4">
          <dt class="text-text-muted">{GOOGLE_ACCOUNT_CHANGE_COPY.currentLabel}</dt>
          <dd class="break-all font-sans text-text">{currentEmail()}</dd>
        </div>
      </dl>

      <Dialog open={isOpen()} onOpenChange={handleOpenChange}>
        <Dialog.Trigger
          as="button"
          type="button"
          class={getAppButtonClass({ variant: 'secondary', class: 'mt-4 w-fit' })}
        >
          {GOOGLE_ACCOUNT_CHANGE_COPY.open}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
          {/* Googleのポップアップとの行き来で誤って閉じないよう、外側の操作では閉じない。 */}
          <Dialog.Content
            class="fixed inset-x-4 top-1/2 z-60 flex max-h-[calc(100dvh-2rem)] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6"
            onInteractOutside={(event) => event.preventDefault()}
          >
            <AppDialogHeader
              title={GOOGLE_ACCOUNT_CHANGE_COPY.title}
              closeLabel={GOOGLE_ACCOUNT_CHANGE_COPY.close}
              closeDisabled={isBusy()}
            />
            <WizardStepIndicator current={step()} />

            <div class="min-h-0 overflow-y-auto">
              {/* ライブ領域は内容が入る前から DOM に置いておかないと読み上げられないため、ステップの外に常設する。 */}
              <p class="text-sm" role="status">
                <Show when={step() === 'done'}>
                  <span class="mt-4 flex items-center justify-center gap-2 font-medium text-action-primary">
                    <CircleCheck aria-hidden="true" class="h-5 w-5" />
                    {GOOGLE_ACCOUNT_CHANGE_COPY.success}
                  </span>
                </Show>
              </p>

              <fieldset
                ref={stepPanel}
                aria-label={GOOGLE_ACCOUNT_CHANGE_COPY.steps[step()]}
                tabIndex={-1}
                class="focus:outline-none"
              >
                <Show
                  when={step() !== 'done'}
                  fallback={
                    <p class="mt-2 break-all text-center font-sans text-sm text-text">
                      {currentEmail()}
                    </p>
                  }
                >
                  <div class="mt-4 flex flex-col items-stretch gap-2 rounded-lg border border-border p-4 text-center text-sm">
                    <p class="break-all font-sans font-medium text-text">
                      {/* ラベルは見た目では省き、読み上げでは現在のアカウントだと分かるようにする。 */}
                      <span class="sr-only">{GOOGLE_ACCOUNT_CHANGE_COPY.currentLabel}</span>
                      {currentEmail()}
                    </p>
                    <ArrowDown aria-hidden="true" class="h-5 w-5 self-center text-text-muted" />
                    {/* 変更先の枠そのものを押してアカウント選択を開く。選択済みなら選び直しになる。 */}
                    <Button
                      class="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border-2 px-3 py-3 text-center transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                      classList={{
                        'border-dashed border-border-strong text-text-muted': !target(),
                        'border-action-primary text-text': Boolean(target()),
                      }}
                      disabled={isBusy()}
                      onClick={handleSelect}
                    >
                      <Show
                        when={target()}
                        fallback={
                          <>
                            <Plus aria-hidden="true" class="h-4 w-4 shrink-0" />
                            {isSelecting()
                              ? GOOGLE_ACCOUNT_CHANGE_COPY.selecting
                              : GOOGLE_ACCOUNT_CHANGE_COPY.select}
                          </>
                        }
                      >
                        {(selectedTarget) => (
                          <>
                            <span class="min-w-0 break-all font-sans font-medium">
                              {selectedTarget().email}
                            </span>
                            <span class="inline-flex shrink-0 items-center gap-1 text-xs text-text-muted">
                              <RefreshCw aria-hidden="true" class="h-3.5 w-3.5" />
                              {isSelecting()
                                ? GOOGLE_ACCOUNT_CHANGE_COPY.selecting
                                : GOOGLE_ACCOUNT_CHANGE_COPY.reselect}
                            </span>
                          </>
                        )}
                      </Show>
                    </Button>
                  </div>
                </Show>
              </fieldset>
              <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                {error()}
              </p>
            </div>

            <Show when={step() === 'confirm'}>
              <div class={DIALOG_FOOTER_CLASS}>
                <AppButton
                  variant="primary"
                  leftIcon={<ShieldCheck aria-hidden="true" class="h-4 w-4" />}
                  disabled={isBusy()}
                  onClick={handleProceed}
                >
                  {GOOGLE_ACCOUNT_CHANGE_COPY.proceed}
                </AppButton>
              </div>
            </Show>
            <Show when={step() === 'done'}>
              <div class={DIALOG_FOOTER_CLASS}>
                <Dialog.CloseButton class={getAppButtonClass({ variant: 'primary' })}>
                  {GOOGLE_ACCOUNT_CHANGE_COPY.close}
                </Dialog.CloseButton>
              </div>
            </Show>

            {/* 本人確認に使うアカウントを示してから再認証のポップアップを開く。 */}
            <Dialog open={isReauthOpen()} onOpenChange={handleReauthOpenChange}>
              <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-70 bg-overlay" />
                <Dialog.Content
                  class="fixed inset-x-4 top-1/2 z-80 flex max-h-[calc(100dvh-2rem)] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-sm sm:-translate-x-1/2 sm:p-6"
                  onInteractOutside={(event) => event.preventDefault()}
                  onCloseAutoFocus={(event) => {
                    // 本人確認へ進むボタンは完了時に消えるため、ウィザード本体へフォーカスを戻す。
                    event.preventDefault()
                    stepPanel?.focus()
                  }}
                >
                  <AppDialogHeader
                    title={GOOGLE_ACCOUNT_CHANGE_COPY.reauthTitle}
                    closeLabel={GOOGLE_ACCOUNT_CHANGE_COPY.close}
                    closeDisabled={isSubmitting()}
                  />
                  <div class="mt-4 flex flex-col items-center gap-2 rounded-lg border-2 border-action-primary p-4 text-center">
                    <ShieldCheck aria-hidden="true" class="h-6 w-6 text-action-primary" />
                    <p class="break-all font-sans text-base font-semibold text-text">
                      {currentEmail()}
                    </p>
                  </div>
                  <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                    {reauthError()}
                  </p>
                  <AppButton
                    variant="primary"
                    fullWidth
                    class="mt-5 shrink-0"
                    disabled={isSubmitting()}
                    onClick={handleSubmit}
                  >
                    {isSubmitting()
                      ? GOOGLE_ACCOUNT_CHANGE_COPY.submitting
                      : GOOGLE_ACCOUNT_CHANGE_COPY.reauthSubmit}
                  </AppButton>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </section>
  )
}
