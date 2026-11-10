import { linkWithPopup, reauthenticateWithPopup, type User, unlink } from 'firebase/auth'
import { KeyRound, RefreshCw } from 'lucide-solid'
import { createResource, createSignal, For, Show } from 'solid-js'

import { fetchXAccount } from '../../api/xAccount'
import { AuthProviderIcon } from '../../components/auth/AuthProviderIcon'
import { AppButton } from '../../components/common/AppButton'
import { showSuccessToast } from '../../components/common/AppToast'
import { AppTooltipIconButton } from '../../components/common/AppTooltipIconButton'
import type { AuthProviderDefinition, AuthProviderKind } from '../../constants/authProviders'
import { VISIBLE_AUTH_PROVIDERS } from '../../lib/authProviders'
import { isFeatureEnabled } from '../../lib/featureFlags'
import { auth, createAuthProvider } from '../../lib/firebase'
import {
  canUnlinkAuthProvider,
  findLinkedAuthAccount,
  type LinkedAuthAccount,
  resolveAuthAccountName,
} from '../../usecases/auth/authProviders'
import { syncXAccountFromResult } from '../../usecases/auth/syncXAccount'
import { isAuthPopupClosedError, toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  AUTH_USER_MISMATCH_ERROR_CODE,
  LOGIN_METHOD_COPY,
  LOGIN_METHOD_IN_USE_ERROR_CODE,
} from './AccountSettings.constants'
import {
  SETTINGS_ROW_LIST_CLASS,
  SETTINGS_SUBSECTION_CLASS,
  SETTINGS_SUBSECTION_TITLE_CLASS,
} from './settingsStyles'

/** ログイン方法欄に表示する連携アカウントと、その再読み込み */
export type LoginMethodSettingsSectionProps = {
  /** ログイン中ユーザーに連携された認証プロバイダのアカウント */
  accounts: readonly LinkedAuthAccount[]
  /** 連携・解除・更新の直後に連携アカウントを読み直す */
  onChanged: () => void
}

/** ログイン方法の行で行う操作の種類 */
type LoginMethodAction = 'link' | 'unlink' | 'refresh'

/** 実行中の操作。同じ行の別のボタンに処理中の表示を出さないよう、操作の種類も持つ。 */
type PendingLoginMethodOperation = {
  /** 操作中の認証プロバイダ */
  kind: AuthProviderKind
  /** 実行中の操作の種類 */
  action: LoginMethodAction
}

/** 操作に失敗した認証プロバイダの行に表示するエラー */
type LoginMethodError = {
  /** エラーを表示する認証プロバイダ */
  kind: AuthProviderKind
  /** 表示する文言 */
  message: string
}

/**
 * ログインに使う認証プロバイダの連携状態を表示し、連携・解除を行う。
 * Firebase ユーザーに連携を追加・削除するだけなので、アプリ内のユーザーやデータは変わらない。
 * X は連携後に @ID が変わりうるため、再認証して @ID を取得し直す更新ボタンも置く。
 *
 * @param props - 連携アカウントと、変更後の再読み込み関数。
 * @returns ログイン方法の設定欄。
 */
export const LoginMethodSettingsSection = (props: LoginMethodSettingsSectionProps) => {
  const [pending, setPending] = createSignal<PendingLoginMethodOperation>()
  const [operationError, setOperationError] = createSignal<LoginMethodError>()
  // @ID は表示を補うだけなので、取得に失敗しても表示名で代用して欄全体は表示する。
  // X でのログインが無効な環境では X の行を出さないため、取得もしない。
  const [xAccount, { mutate: mutateXAccount }] = createResource(
    () => isFeatureEnabled('x_login') || undefined,
    () => fetchXAccount().catch(() => null)
  )

  /**
   * 連携・解除・更新を1件ずつ実行する。成功はトーストで知らせ、失敗は対象の行に表示する。
   * ポップアップを閉じて中断した場合は何も表示しない。
   *
   * @param provider - 操作する認証プロバイダ。
   * @param action - 処理中の表示を出すボタンを決める操作の種類。
   * @param operation - ログイン中のユーザーに対する Firebase への連携・解除・再認証の処理。
   * @param successMessage - 成功時にトーストへ表示する文言。
   * @param resolveErrorMessage - 失敗時に表示する文言を決める関数。
   * @returns 処理完了後に解決されるPromise。
   */
  const runOperation = async (
    provider: AuthProviderDefinition,
    action: LoginMethodAction,
    operation: (user: User) => Promise<unknown>,
    successMessage: string,
    resolveErrorMessage: (error: unknown) => string
  ): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      setOperationError({ kind: provider.kind, message: LOGIN_METHOD_COPY.signedOut })
      return
    }

    setPending({ kind: provider.kind, action })
    setOperationError(undefined)
    try {
      await operation(user)
      showSuccessToast(successMessage)
    } catch (error) {
      // 認証のポップアップを自分で閉じただけなら、エラーとして扱わない。
      if (isAuthPopupClosedError(error)) return
      setOperationError({ kind: provider.kind, message: resolveErrorMessage(error) })
    } finally {
      props.onChanged()
      setPending(undefined)
    }
  }

  /**
   * ポップアップで認証したアカウントを、ログイン中のユーザーへ連携する。
   * X を連携した場合は、連携直後にしか得られないトークンで @ID も取得して表示に反映する。
   *
   * @param provider - 連携する認証プロバイダ。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleLink = (provider: AuthProviderDefinition): Promise<void> =>
    runOperation(
      provider,
      'link',
      async (user) => {
        const result = await linkWithPopup(user, createAuthProvider(provider.kind))
        const syncedXAccount = await syncXAccountFromResult(result)
        if (syncedXAccount) mutateXAccount(syncedXAccount)
      },
      LOGIN_METHOD_COPY.linkSuccess(provider.label),
      (error) => {
        if ((error as { code?: unknown } | null)?.code === LOGIN_METHOD_IN_USE_ERROR_CODE) {
          return LOGIN_METHOD_COPY.alreadyInUse(provider.label)
        }
        return toUserFriendlyErrorMessage(error, LOGIN_METHOD_COPY.linkFailure)
      }
    )

  /**
   * ログイン中のユーザーから認証プロバイダの連携を解除する。
   *
   * @param provider - 解除する認証プロバイダ。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleUnlink = (provider: AuthProviderDefinition): Promise<void> =>
    runOperation(
      provider,
      'unlink',
      (user) => unlink(user, provider.providerId),
      LOGIN_METHOD_COPY.unlinkSuccess(provider.label),
      (error) => toUserFriendlyErrorMessage(error, LOGIN_METHOD_COPY.unlinkFailure)
    )

  /**
   * 連携済みの X アカウントで再認証し、再認証直後にしか得られないトークンで @ID を取得し直す。
   * 別の X アカウントを選んだ場合は Firebase が `auth/user-mismatch` で拒否する。
   *
   * @param provider - 更新する認証プロバイダ（X）。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleRefresh = (provider: AuthProviderDefinition): Promise<void> =>
    runOperation(
      provider,
      'refresh',
      async (user) => {
        const result = await reauthenticateWithPopup(user, createAuthProvider(provider.kind))
        const syncedXAccount = await syncXAccountFromResult(result)
        if (!syncedXAccount) throw new Error(LOGIN_METHOD_COPY.refreshFailure)
        mutateXAccount(syncedXAccount)
      },
      LOGIN_METHOD_COPY.refreshSuccess(provider.label),
      (error) => {
        if ((error as { code?: unknown } | null)?.code === AUTH_USER_MISMATCH_ERROR_CODE) {
          return LOGIN_METHOD_COPY.refreshMismatch(provider.label)
        }
        return toUserFriendlyErrorMessage(error, LOGIN_METHOD_COPY.refreshFailure)
      }
    )

  return (
    <section
      aria-labelledby="login-method-title"
      aria-busy={pending() !== undefined}
      class={SETTINGS_SUBSECTION_CLASS}
    >
      <h3 id="login-method-title" class={SETTINGS_SUBSECTION_TITLE_CLASS}>
        <KeyRound aria-hidden="true" class="h-5 w-5" />
        {LOGIN_METHOD_COPY.title}
      </h3>
      <ul class={`mt-2 max-w-md ${SETTINGS_ROW_LIST_CLASS}`}>
        <For each={VISIBLE_AUTH_PROVIDERS}>
          {(provider) => {
            const account = () => findLinkedAuthAccount(props.accounts, provider.kind)
            // Show の子関数は一度しか評価されないため、後から読み込まれる @ID を反映できるよう外で計算する。
            const accountName = () => {
              const linked = account()
              return linked && resolveAuthAccountName(linked, provider.kind, xAccount())
            }
            /**
             * この行で指定の操作を実行中かどうかを返す。
             *
             * @param action - 確かめる操作の種類。
             * @returns 実行中なら true。
             */
            const isPending = (action: LoginMethodAction) =>
              pending()?.kind === provider.kind && pending()?.action === action
            const rowError = () => {
              const current = operationError()
              return current?.kind === provider.kind ? current : undefined
            }

            return (
              <li class="py-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <AuthProviderIcon kind={provider.kind} class="shrink-0" />
                    <div class="min-w-0">
                      <p class="font-medium text-text">{provider.label}</p>
                      <p class="break-all font-sans text-sm text-text-muted">
                        {accountName() ?? LOGIN_METHOD_COPY.notLinked}
                      </p>
                    </div>
                  </div>
                  <Show
                    when={account()}
                    fallback={
                      <AppButton
                        variant="secondary"
                        size="sm"
                        disabled={pending() !== undefined}
                        onClick={() => handleLink(provider)}
                      >
                        {isPending('link') ? LOGIN_METHOD_COPY.linking : LOGIN_METHOD_COPY.link}
                      </AppButton>
                    }
                  >
                    <div class="flex items-center gap-2">
                      {/* @ID を取り直せるのは X だけなので、更新ボタンは X の行にだけ置く。 */}
                      <Show when={provider.kind === 'x'}>
                        <AppTooltipIconButton
                          class="h-9.5 w-9.5"
                          label={LOGIN_METHOD_COPY.refresh(provider.label)}
                          disabled={pending() !== undefined}
                          onClick={() => handleRefresh(provider)}
                        >
                          <RefreshCw
                            aria-hidden="true"
                            class={`h-4 w-4 ${isPending('refresh') ? 'animate-spin' : ''}`}
                          />
                        </AppTooltipIconButton>
                      </Show>
                      {/* 最後のログイン方法を外すとログインできなくなるため、解除ボタンを出さない。 */}
                      <Show
                        when={canUnlinkAuthProvider(
                          props.accounts,
                          provider.kind,
                          VISIBLE_AUTH_PROVIDERS
                        )}
                      >
                        <AppButton
                          variant="dangerOutline"
                          size="sm"
                          disabled={pending() !== undefined}
                          onClick={() => handleUnlink(provider)}
                        >
                          {isPending('unlink')
                            ? LOGIN_METHOD_COPY.unlinking
                            : LOGIN_METHOD_COPY.unlink}
                        </AppButton>
                      </Show>
                    </div>
                  </Show>
                </div>
                <Show when={rowError()}>
                  {(current) => (
                    <p class="mt-2 text-sm text-danger" role="alert">
                      {current().message}
                    </p>
                  )}
                </Show>
              </li>
            )
          }}
        </For>
      </ul>
    </section>
  )
}
