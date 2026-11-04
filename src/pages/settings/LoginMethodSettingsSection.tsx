import { linkWithPopup, type User, unlink } from 'firebase/auth'
import { KeyRound } from 'lucide-solid'
import { createSignal, For, Show } from 'solid-js'

import { AuthProviderIcon } from '../../components/auth/AuthProviderIcon'
import { AppButton } from '../../components/common/AppButton'
import { showSuccessToast } from '../../components/common/AppToast'
import {
  AUTH_PROVIDERS,
  type AuthProviderDefinition,
  type AuthProviderKind,
} from '../../constants/authProviders'
import { auth, createAuthProvider } from '../../lib/firebase'
import {
  canUnlinkAuthProvider,
  findLinkedAuthAccount,
  type LinkedAuthAccount,
  resolveAuthAccountName,
} from '../../usecases/auth/authProviders'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { LOGIN_METHOD_COPY, LOGIN_METHOD_IN_USE_ERROR_CODE } from './AccountSettings.constants'

/** ログイン方法欄に表示する連携アカウントと、その再読み込み */
export type LoginMethodSettingsSectionProps = {
  /** ログイン中ユーザーに連携された認証プロバイダのアカウント */
  accounts: readonly LinkedAuthAccount[]
  /** 連携・解除の直後に連携アカウントを読み直す */
  onChanged: () => void
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
 *
 * @param props - 連携アカウントと、変更後の再読み込み関数。
 * @returns ログイン方法の設定欄。
 */
export const LoginMethodSettingsSection = (props: LoginMethodSettingsSectionProps) => {
  const [pendingKind, setPendingKind] = createSignal<AuthProviderKind>()
  const [operationError, setOperationError] = createSignal<LoginMethodError>()

  /**
   * 連携・解除を1件ずつ実行する。成功はトーストで知らせ、失敗は対象の行に表示する。
   *
   * @param provider - 操作する認証プロバイダ。
   * @param operation - ログイン中のユーザーに対する Firebase への連携または解除処理。
   * @param successMessage - 成功時にトーストへ表示する文言。
   * @param resolveErrorMessage - 失敗時に表示する文言を決める関数。
   * @returns 処理完了後に解決されるPromise。
   */
  const runOperation = async (
    provider: AuthProviderDefinition,
    operation: (user: User) => Promise<unknown>,
    successMessage: string,
    resolveErrorMessage: (error: unknown) => string
  ): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      setOperationError({ kind: provider.kind, message: LOGIN_METHOD_COPY.signedOut })
      return
    }

    setPendingKind(provider.kind)
    setOperationError(undefined)
    try {
      await operation(user)
      showSuccessToast(successMessage)
    } catch (error) {
      setOperationError({ kind: provider.kind, message: resolveErrorMessage(error) })
    } finally {
      props.onChanged()
      setPendingKind(undefined)
    }
  }

  /**
   * ポップアップで認証したアカウントを、ログイン中のユーザーへ連携する。
   *
   * @param provider - 連携する認証プロバイダ。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleLink = (provider: AuthProviderDefinition): Promise<void> =>
    runOperation(
      provider,
      (user) => linkWithPopup(user, createAuthProvider(provider.kind)),
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
      (user) => unlink(user, provider.providerId),
      LOGIN_METHOD_COPY.unlinkSuccess(provider.label),
      (error) => toUserFriendlyErrorMessage(error, LOGIN_METHOD_COPY.unlinkFailure)
    )

  return (
    <section
      aria-labelledby="login-method-title"
      aria-busy={pendingKind() !== undefined}
      class="mt-10 border-t border-border pt-6"
    >
      <h3 id="login-method-title" class="flex items-center gap-2 font-semibold text-text">
        <KeyRound aria-hidden="true" class="h-5 w-5" />
        {LOGIN_METHOD_COPY.title}
      </h3>
      <ul class="mt-4 max-w-md divide-y divide-border border-y border-border">
        <For each={AUTH_PROVIDERS}>
          {(provider) => {
            const account = () => findLinkedAuthAccount(props.accounts, provider.kind)
            const isPending = () => pendingKind() === provider.kind
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
                        <Show when={account()} fallback={LOGIN_METHOD_COPY.notLinked}>
                          {(linked) => resolveAuthAccountName(linked(), provider.kind)}
                        </Show>
                      </p>
                    </div>
                  </div>
                  <Show
                    when={account()}
                    fallback={
                      <AppButton
                        variant="secondary"
                        size="sm"
                        disabled={pendingKind() !== undefined}
                        onClick={() => handleLink(provider)}
                      >
                        {isPending() ? LOGIN_METHOD_COPY.linking : LOGIN_METHOD_COPY.link}
                      </AppButton>
                    }
                  >
                    {/* 最後のログイン方法を外すとログインできなくなるため、解除ボタンを出さない。 */}
                    <Show when={canUnlinkAuthProvider(props.accounts, provider.kind)}>
                      <AppButton
                        variant="dangerOutline"
                        size="sm"
                        disabled={pendingKind() !== undefined}
                        onClick={() => handleUnlink(provider)}
                      >
                        {isPending() ? LOGIN_METHOD_COPY.unlinking : LOGIN_METHOD_COPY.unlink}
                      </AppButton>
                    </Show>
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
