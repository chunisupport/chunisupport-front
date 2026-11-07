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
  TriangleAlert,
} from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, For, on, onMount, Show } from 'solid-js'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { AppDialogHeader } from '../../components/common/AppDialogHeader'
import { LOGIN_PATH } from '../../constants/routes'
import { getAccountChangeAuth } from '../../lib/firebase'
import {
  cancelGoogleAccountChange,
  changeGoogleAccount,
  getCurrentGoogleEmail,
  selectGoogleAccountChangeTarget,
} from '../../usecases/auth/changeGoogleAccount'
import { discardLocalSession } from '../../usecases/auth/discardLocalSession'
import { GOOGLE_ACCOUNT_CHANGE_COPY } from './AccountSettings.constants'
import {
  createGoogleAccountChangeWizard,
  type GoogleAccountChangeStep,
} from './createGoogleAccountChangeWizard'
import { SETTINGS_SUBSECTION_CLASS, SETTINGS_SUBSECTION_TITLE_CLASS } from './settingsStyles'

const WIZARD_STEPS: readonly GoogleAccountChangeStep[] = ['select', 'confirm', 'done']

/** ダイアログ下部のボタン配置 */
const DIALOG_FOOTER_CLASS = 'mt-5 flex shrink-0 flex-wrap justify-end gap-2'

/**
 * ウィザードの進行状況を表示する。
 *
 * @param props - 現在のステップ。
 * @returns ステップ表示。
 */
const WizardStepIndicator: Component<{ current: GoogleAccountChangeStep }> = (props) => {
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
 * @param props - ログイン中ユーザーがXも連携しているかどうか。
 * @returns Googleアカウント変更欄とウィザードダイアログ。
 */
export const GoogleAccountChangeForm: Component<{
  /** Xも連携している場合は、変更で連携が外れることを知らせる */
  xLinked: boolean
}> = (props) => {
  const navigate = useNavigate()
  const wizard = createGoogleAccountChangeWizard({
    getCurrentEmail: getCurrentGoogleEmail,
    selectTarget: selectGoogleAccountChangeTarget,
    cancelChange: cancelGoogleAccountChange,
    changeAccount: changeGoogleAccount,
    onSessionLost: async () => {
      await discardLocalSession()
      navigate(LOGIN_PATH, { replace: true })
    },
  })
  let stepPanel: HTMLFieldSetElement | undefined

  // Safari などではクリック後に初期化するとポップアップがブロックされるため、表示時に初期化しておく。
  onMount(() => {
    getAccountChangeAuth()
  })

  // 本人確認へ進むボタンは完了時やエラーでの選び直し時に消えるため、キーボード操作の位置を失わないようフォーカスを移す。
  // 変更先の枠は選択と確認のステップをまたいで残るため、確認ステップへ進むときは移さない。
  createEffect(
    on(
      wizard.step,
      (current) => {
        if (wizard.isOpen() && current !== 'confirm') stepPanel?.focus()
      },
      { defer: true }
    )
  )

  return (
    <section aria-labelledby="google-account-change-title" class={SETTINGS_SUBSECTION_CLASS}>
      <h3 id="google-account-change-title" class={SETTINGS_SUBSECTION_TITLE_CLASS}>
        <ArrowRightLeft aria-hidden="true" class="h-5 w-5" />
        {GOOGLE_ACCOUNT_CHANGE_COPY.title}
      </h3>
      <dl class="mt-4 max-w-md text-sm">
        <div class="flex flex-wrap justify-between gap-x-4">
          <dt class="text-text-muted">{GOOGLE_ACCOUNT_CHANGE_COPY.currentLabel}</dt>
          <dd class="break-all font-sans text-text">{wizard.currentEmail()}</dd>
        </div>
      </dl>

      <Dialog open={wizard.isOpen()} onOpenChange={wizard.setOpen}>
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
              closeDisabled={wizard.isBusy()}
            />
            <WizardStepIndicator current={wizard.step()} />

            <div class="min-h-0 overflow-y-auto">
              {/* ライブ領域は内容が入る前から DOM に置いておかないと読み上げられないため、ステップの外に常設する。 */}
              <p class="text-sm" role="status">
                <Show when={wizard.step() === 'done'}>
                  <span class="mt-4 flex items-center justify-center gap-2 font-medium text-action-primary">
                    <CircleCheck aria-hidden="true" class="h-5 w-5" />
                    {GOOGLE_ACCOUNT_CHANGE_COPY.success}
                  </span>
                </Show>
              </p>

              <fieldset
                ref={stepPanel}
                aria-label={GOOGLE_ACCOUNT_CHANGE_COPY.steps[wizard.step()]}
                tabIndex={-1}
                class="focus:outline-none"
              >
                <Show
                  when={wizard.step() !== 'done'}
                  fallback={
                    <p class="mt-2 break-all text-center font-sans text-sm text-text">
                      {wizard.currentEmail()}
                    </p>
                  }
                >
                  <div class="mt-4 flex flex-col items-stretch gap-2 rounded-lg border border-border p-4 text-center text-sm">
                    <p class="break-all font-sans font-medium text-text">
                      {/* ラベルは見た目では省き、読み上げでは現在のアカウントだと分かるようにする。 */}
                      <span class="sr-only">{GOOGLE_ACCOUNT_CHANGE_COPY.currentLabel}</span>
                      {wizard.currentEmail()}
                    </p>
                    {/* 変更でXでのログインが使えなくなることを、変更前の操作の場で示す。 */}
                    <Show when={props.xLinked}>
                      <span class="inline-flex items-center gap-1 self-center rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-xs text-warning">
                        <TriangleAlert aria-hidden="true" class="h-3.5 w-3.5 shrink-0" />
                        {GOOGLE_ACCOUNT_CHANGE_COPY.xLinkRemoved}
                      </span>
                    </Show>
                    <ArrowDown aria-hidden="true" class="h-5 w-5 self-center text-text-muted" />
                    {/* 変更先の枠そのものを押してアカウント選択を開く。選択済みなら選び直しになる。 */}
                    <Button
                      class="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border-2 px-3 py-3 text-center transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                      classList={{
                        'border-dashed border-border-strong text-text-muted': !wizard.target(),
                        'border-action-primary text-text': Boolean(wizard.target()),
                      }}
                      disabled={wizard.isBusy()}
                      onClick={() => void wizard.select()}
                    >
                      <Show
                        when={wizard.target()}
                        fallback={
                          <>
                            <Plus aria-hidden="true" class="h-4 w-4 shrink-0" />
                            {wizard.isSelecting()
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
                              {wizard.isSelecting()
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
                {wizard.error()}
              </p>
            </div>

            <Show when={wizard.step() === 'confirm'}>
              <div class={DIALOG_FOOTER_CLASS}>
                <AppButton
                  variant="primary"
                  leftIcon={<ShieldCheck aria-hidden="true" class="h-4 w-4" />}
                  disabled={wizard.isBusy()}
                  onClick={wizard.proceed}
                >
                  {GOOGLE_ACCOUNT_CHANGE_COPY.proceed}
                </AppButton>
              </div>
            </Show>
            <Show when={wizard.step() === 'done'}>
              <div class={DIALOG_FOOTER_CLASS}>
                <Dialog.CloseButton class={getAppButtonClass({ variant: 'primary' })}>
                  {GOOGLE_ACCOUNT_CHANGE_COPY.close}
                </Dialog.CloseButton>
              </div>
            </Show>

            {/* 本人確認に使うアカウントを示してから再認証のポップアップを開く。 */}
            <Dialog open={wizard.isReauthOpen()} onOpenChange={wizard.setReauthOpen}>
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
                    closeDisabled={wizard.isSubmitting()}
                  />
                  <div class="mt-4 flex flex-col items-center gap-2 rounded-lg border-2 border-action-primary p-4 text-center">
                    <ShieldCheck aria-hidden="true" class="h-6 w-6 text-action-primary" />
                    <p class="break-all font-sans text-base font-semibold text-text">
                      {wizard.currentEmail()}
                    </p>
                  </div>
                  <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                    {wizard.reauthError()}
                  </p>
                  <AppButton
                    variant="primary"
                    fullWidth
                    class="mt-5 shrink-0"
                    disabled={wizard.isSubmitting()}
                    onClick={() => void wizard.submit()}
                  >
                    {wizard.isSubmitting()
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
