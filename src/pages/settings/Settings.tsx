import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Switch } from '@kobalte/core/switch'
import { A, useNavigate, useParams } from '@solidjs/router'
import { useQueryClient } from '@tanstack/solid-query'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { deleteAccount, deletePlayerData, fetchPrivacy, updatePrivacy } from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import AppearanceSettings from '../../components/common/AppearanceSettings'
import { APPEARANCE_SETTINGS_COPY } from '../../components/common/AppearanceSettings.constants'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { invalidateFriendRankings } from '../../queries/friendRankings'
import { authSession, clearAuthenticatedUser, setAuthenticatedUser } from '../../stores/authSession'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { clearUsernameChangeCache } from '../../usecases/cache/clearUsernameChangeCache'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { ApiTokenSettingsSection } from './ApiTokenSettingsSection'
import { DataTransferSettingsSection } from './DataTransferSettingsSection'
import { formatSettingsDateTime } from './settingsDateTime'
import { normalizeSettingsSection, SETTINGS_SECTIONS } from './settingsSections'
import { UsernameChangeForm } from './UsernameChangeForm'

type SettingsSummary = {
  me: Awaited<ReturnType<typeof fetchMe>>
  profile: Awaited<ReturnType<typeof fetchUserProfileSummary>>
}

/**
 * ユーザー設定画面を表示する。
 *
 * @returns 設定画面のJSX要素。
 */
const Settings = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ section?: string }>()
  const [privacyValue, setPrivacyValue] = createSignal(false)
  const [privacySubmitting, setPrivacySubmitting] = createSignal(false)
  const [privacyError, setPrivacyError] = createSignal('')
  const [privacySuccess, setPrivacySuccess] = createSignal('')
  const [playerDeleteDialogOpen, setPlayerDeleteDialogOpen] = createSignal(false)
  const [playerDeleting, setPlayerDeleting] = createSignal(false)
  const [playerDataError, setPlayerDataError] = createSignal('')
  const [playerDataSuccess, setPlayerDataSuccess] = createSignal('')
  const [accountDeleteDialogOpen, setAccountDeleteDialogOpen] = createSignal(false)
  const [accountDeleting, setAccountDeleting] = createSignal(false)
  const [accountDeleteError, setAccountDeleteError] = createSignal('')

  useDocumentTitle('設定')

  /**
   * ログイン中ユーザーのフレンドランキングキャッシュを無効化する。
   *
   * @returns 表示中ランキングの再取得完了時に解決されるPromise。
   */
  const invalidateCurrentUserFriendRankings = (): Promise<void> => {
    const username = authSession.user?.username
    return username ? invalidateFriendRankings(queryClient, username) : Promise.resolve()
  }
  const [summary, { refetch: refetchSummary, mutate: mutateSummary }] = createResource(
    () => authSession.user?.username,
    async (username): Promise<SettingsSummary> => {
      const [me, profile] = await Promise.all([
        fetchMe({ redirectOnUnauthorized: false }),
        fetchUserProfileSummary(username),
      ])
      return { me, profile }
    }
  )
  createEffect(() => {
    const currentSummary = summary()
    if (currentSummary) {
      setPrivacyValue(currentSummary.me.is_private)
    }
  })

  /**
   * 現在のURLに対応する設定カテゴリを返す。
   *
   * @returns 表示対象の設定カテゴリID。
   */
  const activeSection = () => normalizeSettingsSection(params.section)

  /**
   * APIから最新のプロフィール公開設定を取得する。
   *
   * @returns 取得と状態反映の完了後に解決されるPromise。
   */
  const handlePrivacyRefresh = async () => {
    const currentPrivacy = await fetchPrivacy()
    setPrivacyValue(currentPrivacy.is_private)
  }

  /**
   * プライバシー設定を切り替え、失敗時は直前の状態へ戻す。
   *
   * @param nextValue 切り替え後の非公開状態。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleTogglePrivacy = async (nextValue: boolean) => {
    setPrivacyError('')
    setPrivacySuccess('')
    const previousValue = privacyValue()
    setPrivacyValue(nextValue)
    setPrivacySubmitting(true)
    try {
      const result = await updatePrivacy(nextValue)
      setPrivacyValue(result.is_private)
      mutateSummary((current) =>
        current
          ? {
              ...current,
              me: {
                ...current.me,
                is_private: result.is_private,
              },
            }
          : current
      )
      setPrivacySuccess('非公開設定を更新しました。')
    } catch (error) {
      setPrivacyValue(previousValue)
      setPrivacyError(toUserFriendlyErrorMessage(error, '設定更新に失敗しました。'))
      await handlePrivacyRefresh()
    } finally {
      setPrivacySubmitting(false)
    }
  }

  /**
   * ユーザーID変更後に認証状態と画面表示を更新し、旧IDに依存するキャッシュを破棄する。
   *
   * @param username - APIが返した変更後のユーザー名。
   * @returns 状態更新とキャッシュ破棄の試行完了後に解決されるPromise。
   */
  const handleUsernameChanged = async (username: string): Promise<void> => {
    const previousUsername = authSession.user?.username ?? summary()?.me.username
    const currentUser = authSession.user
    if (currentUser) {
      setAuthenticatedUser({ ...currentUser, username })
    }
    mutateSummary((current) =>
      current
        ? {
            me: { ...current.me, username },
            profile: { ...current.profile, username },
          }
        : current
    )

    if (previousUsername) {
      await clearUsernameChangeCache(queryClient, previousUsername)
    }
  }

  /**
   * 確認ダイアログからプレイヤーデータを削除する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDeletePlayerData = async () => {
    setPlayerDataError('')
    setPlayerDataSuccess('')
    setPlayerDeleting(true)
    try {
      await deletePlayerData()
      await invalidateCurrentUserFriendRankings().catch(() => undefined)
      setPlayerDeleteDialogOpen(false)
      setPlayerDataSuccess('プレイヤーデータを削除しました。必要であれば再登録してください。')
      await refetchSummary()
    } catch (error) {
      setPlayerDataError(toUserFriendlyErrorMessage(error, 'プレイヤーデータ削除に失敗しました。'))
    } finally {
      setPlayerDeleting(false)
    }
  }

  /**
   * 確認ダイアログからアカウントを退会処理し、ログイン画面へ遷移する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDeleteAccount = async () => {
    setAccountDeleteError('')
    setAccountDeleting(true)
    try {
      await deleteAccount()
      await auth.signOut()
      await clearClientCache().catch(() => undefined)
      clearAuthenticatedUser()
      navigate('/login', { replace: true })
    } catch (error) {
      const err = error as Error & { code?: string }
      if (err.code === 'auth/popup-closed-by-user') {
        setAccountDeleteError('再認証がキャンセルされました。')
      } else if (err.code === 'auth/user-mismatch') {
        setAccountDeleteError('ログイン中のアカウントと異なるアカウントで再認証されました。')
      } else if (err.code === 'recent_sign_in_required') {
        setAccountDeleteError('再認証の有効期限が切れています。もう一度お試しください。')
      } else {
        setAccountDeleteError(toUserFriendlyErrorMessage(error, '退会処理に失敗しました。'))
      }
    } finally {
      setAccountDeleting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4">
      <h1 class="mb-6 text-2xl font-semibold text-text">設定</h1>
      <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="設定カテゴリ" class="md:sticky md:top-4 md:self-start">
          <ul class="flex gap-2 overflow-x-auto border-b border-border pb-3 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <For each={SETTINGS_SECTIONS}>
              {(section) => (
                <li class="shrink-0">
                  <A
                    href={`/settings/${section.id}`}
                    aria-current={activeSection() === section.id ? 'page' : undefined}
                    class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-hover aria-[current=page]:bg-action-secondary aria-[current=page]:text-text"
                  >
                    {section.label}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </nav>

        <main class="min-w-0">
          <Show when={activeSection() === 'appearance'}>
            <section aria-labelledby="appearance-title">
              <h2 id="appearance-title" class="mb-5 text-xl font-semibold text-text">
                {APPEARANCE_SETTINGS_COPY.sectionTitle}
              </h2>
              <AppearanceSettings />
            </section>
          </Show>

          <Show when={!summary.error} fallback={<LoadError error={summary.error} />}>
            <Show when={summary()} fallback={<Loading />}>
              {(loadedSummary) => (
                <>
                  <Show when={activeSection() === 'profile'}>
                    <section aria-labelledby="profile-title">
                      <h2 id="profile-title" class="text-xl font-semibold text-text">
                        プロフィール
                      </h2>
                      <div class="mt-5 flex items-center justify-between gap-4 border-b border-border py-4">
                        <div>
                          <h3 class="font-medium text-text">プロフィールを非公開にする</h3>
                          <p class="mt-1 text-sm text-text-muted">
                            プロフィールとプレイ情報を自分だけに表示します。
                          </p>
                        </div>
                        <Switch
                          checked={privacyValue()}
                          onChange={handleTogglePrivacy}
                          disabled={privacySubmitting()}
                        >
                          <Switch.Input aria-label="プロフィールを非公開にする" />
                          <Switch.Control class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-border-strong transition data-[checked]:bg-action-primary data-disabled:cursor-not-allowed data-disabled:opacity-60">
                            <Switch.Thumb class="inline-block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition data-[checked]:translate-x-5" />
                          </Switch.Control>
                        </Switch>
                      </div>
                      <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                        {privacyError()}
                      </p>
                      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
                        {privacySuccess()}
                      </p>
                    </section>
                  </Show>

                  <Show when={activeSection() === 'api'}>
                    <ApiTokenSettingsSection username={loadedSummary().me.username} />
                  </Show>

                  <Show when={activeSection() === 'data'}>
                    <div class="space-y-10">
                      <section aria-labelledby="player-data-title">
                        <h2 id="player-data-title" class="text-xl font-semibold text-text">
                          プレイヤーデータ
                        </h2>
                        <dl class="mt-5 divide-y divide-border border-y border-border">
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">連携状態</dt>
                            <dd class="font-medium text-text">
                              {loadedSummary().profile.player ? '連携済み' : '未連携'}
                            </dd>
                          </div>
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">最終更新</dt>
                            <dd class="font-medium text-text">
                              {formatSettingsDateTime(loadedSummary().me.last_score_update)}
                            </dd>
                          </div>
                        </dl>
                        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                          {playerDataError()}
                        </p>
                        <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
                          {playerDataSuccess()}
                        </p>
                        <AppButton
                          variant="dangerOutline"
                          class="mt-4"
                          onClick={() => setPlayerDeleteDialogOpen(true)}
                          disabled={!loadedSummary().profile.player}
                        >
                          プレイヤーデータを削除
                        </AppButton>
                      </section>
                      <DataTransferSettingsSection
                        hasUserData={Boolean(loadedSummary().profile.player)}
                        onImported={async () => {
                          await Promise.allSettled([
                            invalidateCurrentUserFriendRankings(),
                            refetchSummary(),
                          ])
                        }}
                      />
                    </div>
                  </Show>

                  <Show when={activeSection() === 'account'}>
                    <section aria-labelledby="account-title">
                      <h2 id="account-title" class="text-xl font-semibold text-text">
                        アカウント
                      </h2>
                      <dl class="mt-5 divide-y divide-border border-y border-border">
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">ユーザー名</dt>
                          <dd class="font-sans font-medium text-text">
                            {loadedSummary().me.username}
                          </dd>
                        </div>
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">アカウント種別</dt>
                          <dd class="font-medium text-text">{loadedSummary().me.account_type}</dd>
                        </div>
                      </dl>
                      <UsernameChangeForm
                        currentUsername={loadedSummary().me.username}
                        onChanged={handleUsernameChanged}
                      />
                      <div class="mt-10 border-t border-danger-border pt-6">
                        <h3 class="font-semibold text-danger">退会</h3>
                        <p class="mt-1 text-sm text-text-muted">
                          アカウントと関連データを完全に削除します。
                        </p>
                        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                          {accountDeleteError()}
                        </p>
                        <AppButton
                          variant="danger"
                          class="mt-4"
                          onClick={() => setAccountDeleteDialogOpen(true)}
                        >
                          退会する
                        </AppButton>
                      </div>
                    </section>
                  </Show>
                </>
              )}
            </Show>
          </Show>
        </main>
      </div>

      <AlertDialog open={playerDeleteDialogOpen()} onOpenChange={setPlayerDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
          <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
            <AlertDialog.Title class="text-lg font-bold text-text">
              プレイヤーデータを削除しますか？
            </AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              スコア記録を含むプレイヤーデータが削除されます。この操作は取り消せません。
            </AlertDialog.Description>
            <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
              {playerDataError()}
            </p>
            <div class="mt-6 flex justify-end gap-2">
              <AlertDialog.CloseButton class="rounded bg-action-secondary px-4 py-2 text-sm font-medium text-text-muted">
                キャンセル
              </AlertDialog.CloseButton>
              <AppButton
                variant="danger"
                onClick={handleDeletePlayerData}
                disabled={playerDeleting()}
              >
                {playerDeleting() ? '削除中...' : '削除する'}
              </AppButton>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      <AlertDialog open={accountDeleteDialogOpen()} onOpenChange={setAccountDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
          <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
            <AlertDialog.Title class="text-lg font-bold text-danger">
              本当に退会しますか？
            </AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              ユーザー情報、プレイヤーデータ、目標、APIトークンがすべて削除されます。本人確認のため再認証が必要です。
            </AlertDialog.Description>
            <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
              {accountDeleteError()}
            </p>
            <div class="mt-6 flex justify-end gap-2">
              <AlertDialog.CloseButton class="rounded bg-action-secondary px-4 py-2 text-sm font-medium text-text-muted">
                キャンセル
              </AlertDialog.CloseButton>
              <AppButton
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={accountDeleting()}
              >
                {accountDeleting() ? '処理中...' : '退会する'}
              </AppButton>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </div>
  )
}

export default Settings
