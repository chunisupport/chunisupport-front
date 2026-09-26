import { AlertDialog } from '@kobalte/core/alert-dialog'
import { A, useNavigate, useParams } from '@solidjs/router'
import { useQueryClient } from '@tanstack/solid-query'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { deleteAccount, deletePlayerData, fetchPrivacy, updatePrivacy } from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import AppearanceSettings from '../../components/common/AppearanceSettings'
import { APPEARANCE_SETTINGS_COPY } from '../../components/common/AppearanceSettings.constants'
import { AppSwitch } from '../../components/common/AppSwitch'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { localizedCopy, t } from '../../i18n'
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

/** 設定画面の表示文言 */
const SETTINGS_COPY = localizedCopy('settings.page')

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

  useDocumentTitle(() => t('nav.settings'))

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
      setPrivacySuccess(SETTINGS_COPY.privacyUpdated)
    } catch (error) {
      setPrivacyValue(previousValue)
      setPrivacyError(toUserFriendlyErrorMessage(error, SETTINGS_COPY.privacyFailed))
      await handlePrivacyRefresh()
    } finally {
      setPrivacySubmitting(false)
    }
  }

  /**
   * ユーザーネーム変更後に認証状態と画面表示を更新し、旧ユーザーネームに依存するキャッシュを破棄する。
   *
   * @param username - APIが返した変更後のユーザーネーム。
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
      setPlayerDataSuccess(SETTINGS_COPY.playerDataDeleted)
      await refetchSummary()
    } catch (error) {
      setPlayerDataError(toUserFriendlyErrorMessage(error, SETTINGS_COPY.playerDataDeleteFailed))
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
        setAccountDeleteError(SETTINGS_COPY.reauthCancelled)
      } else if (err.code === 'auth/user-mismatch') {
        setAccountDeleteError(SETTINGS_COPY.reauthMismatch)
      } else if (err.code === 'recent_sign_in_required') {
        setAccountDeleteError(SETTINGS_COPY.reauthExpired)
      } else {
        setAccountDeleteError(toUserFriendlyErrorMessage(error, SETTINGS_COPY.accountDeleteFailed))
      }
    } finally {
      setAccountDeleting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4">
      <h1 class="mb-6 text-2xl font-semibold text-text">{t('nav.settings')}</h1>
      <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label={SETTINGS_COPY.categories} class="md:sticky md:top-4 md:self-start">
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
                        {t('settings.sections.profile')}
                      </h2>
                      <div class="mt-5 flex items-center justify-between gap-4 border-b border-border py-4">
                        <div>
                          <h3 class="font-medium text-text">{SETTINGS_COPY.privateProfile}</h3>
                          <p class="mt-1 text-sm text-text-muted">
                            {SETTINGS_COPY.privateProfileDescription}
                          </p>
                        </div>
                        <AppSwitch
                          checked={privacyValue()}
                          onChange={handleTogglePrivacy}
                          disabled={privacySubmitting()}
                          label={SETTINGS_COPY.privateProfile}
                        />
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
                    <ApiTokenSettingsSection
                      username={loadedSummary().me.username}
                      accountType={loadedSummary().me.account_type}
                    />
                  </Show>

                  <Show when={activeSection() === 'data'}>
                    <div class="space-y-10">
                      <section aria-labelledby="player-data-title">
                        <h2 id="player-data-title" class="text-xl font-semibold text-text">
                          {SETTINGS_COPY.playerData}
                        </h2>
                        <dl class="mt-5 divide-y divide-border border-y border-border">
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">{SETTINGS_COPY.linkStatus}</dt>
                            <dd class="font-medium text-text">
                              {loadedSummary().profile.player
                                ? SETTINGS_COPY.linked
                                : SETTINGS_COPY.unlinked}
                            </dd>
                          </div>
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">{SETTINGS_COPY.lastUpdated}</dt>
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
                          {SETTINGS_COPY.deletePlayerData}
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
                        {t('settings.sections.account')}
                      </h2>
                      <dl class="mt-5 divide-y divide-border border-y border-border">
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">{SETTINGS_COPY.username}</dt>
                          <dd class="font-sans font-medium text-text">
                            {loadedSummary().me.username}
                          </dd>
                        </div>
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">{SETTINGS_COPY.accountType}</dt>
                          <dd class="font-medium text-text">{loadedSummary().me.account_type}</dd>
                        </div>
                      </dl>
                      <UsernameChangeForm
                        currentUsername={loadedSummary().me.username}
                        onChanged={handleUsernameChanged}
                      />
                      <div class="mt-10 border-t border-danger-border pt-6">
                        <h3 class="font-semibold text-danger">
                          {SETTINGS_COPY.deleteAccountTitle}
                        </h3>
                        <p class="mt-1 text-sm text-text-muted">
                          {SETTINGS_COPY.deleteAccountDescription}
                        </p>
                        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                          {accountDeleteError()}
                        </p>
                        <AppButton
                          variant="danger"
                          class="mt-4"
                          onClick={() => setAccountDeleteDialogOpen(true)}
                        >
                          {SETTINGS_COPY.deleteAccount}
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
              {SETTINGS_COPY.playerDataDeleteTitle}
            </AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              {SETTINGS_COPY.playerDataDeleteDescription}
            </AlertDialog.Description>
            <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
              {playerDataError()}
            </p>
            <div class="mt-6 flex justify-end gap-2">
              <AlertDialog.CloseButton class="rounded bg-action-secondary px-4 py-2 text-sm font-medium text-text-muted">
                {t('common.cancel')}
              </AlertDialog.CloseButton>
              <AppButton
                variant="danger"
                onClick={handleDeletePlayerData}
                disabled={playerDeleting()}
              >
                {playerDeleting() ? SETTINGS_COPY.deleting : SETTINGS_COPY.delete}
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
              {SETTINGS_COPY.deleteAccountConfirmTitle}
            </AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              {SETTINGS_COPY.deleteAccountConfirmDescription}
            </AlertDialog.Description>
            <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
              {accountDeleteError()}
            </p>
            <div class="mt-6 flex justify-end gap-2">
              <AlertDialog.CloseButton class="rounded bg-action-secondary px-4 py-2 text-sm font-medium text-text-muted">
                {t('common.cancel')}
              </AlertDialog.CloseButton>
              <AppButton
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={accountDeleting()}
              >
                {accountDeleting() ? SETTINGS_COPY.processing : SETTINGS_COPY.deleteAccount}
              </AppButton>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </div>
  )
}

export default Settings
