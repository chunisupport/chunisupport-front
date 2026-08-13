import { Switch } from '@kobalte/core/switch'
import { useNavigate, useParams } from '@solidjs/router'
import { createEffect, createResource, createSignal, Show } from 'solid-js'
import { deleteAccount, deletePlayerData, fetchPrivacy, updatePrivacy } from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import AppearanceSettings from '../../components/common/AppearanceSettings'
import { APPEARANCE_SETTINGS_COPY } from '../../components/common/AppearanceSettings.constants'
import { CheckboxField } from '../../components/common/CheckboxField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { authSession, clearAuthenticatedUser } from '../../stores/authSession'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { formatRatingFixed2 } from '../../utils/ratingFormat'
import { ApiTokenSettingsSection } from './ApiTokenSettingsSection'
import { DataTransferSettingsSection } from './DataTransferSettingsSection'
import { formatSettingsDateTime } from './settingsDateTime'

const SECTION_IDS = [
  'appearance',
  'privacy',
  'api-token',
  'data-transfer',
  'player-data',
  'account-delete',
] as const

type SectionId = (typeof SECTION_IDS)[number]

type SettingsSummary = {
  me: Awaited<ReturnType<typeof fetchMe>>
  profile: Awaited<ReturnType<typeof fetchUserProfileSummary>>
}

// アカウント種別ラベルマップを廃止 — 生の `account_type` をそのまま表示します。

const normalizeSection = (section?: string): SectionId | null => {
  if (typeof section === 'undefined') {
    return null
  }

  return SECTION_IDS.find((value) => value === section) ?? null
}

/**
 * ユーザー設定画面を表示する。
 *
 * @returns 設定画面のJSX要素。
 */
const Settings = () => {
  const navigate = useNavigate()
  const params = useParams<{ section?: string }>()
  const [privacyValue, setPrivacyValue] = createSignal(false)
  const [privacySubmitting, setPrivacySubmitting] = createSignal(false)
  const [privacyError, setPrivacyError] = createSignal('')
  const [privacySuccess, setPrivacySuccess] = createSignal('')
  const [playerDeleteConfirmed, setPlayerDeleteConfirmed] = createSignal(false)
  const [playerDeleting, setPlayerDeleting] = createSignal(false)
  const [playerDataError, setPlayerDataError] = createSignal('')
  const [playerDataSuccess, setPlayerDataSuccess] = createSignal('')
  const [accountDeleteConfirmed, setAccountDeleteConfirmed] = createSignal(false)
  const [accountDeleting, setAccountDeleting] = createSignal(false)
  const [accountDeleteError, setAccountDeleteError] = createSignal('')

  useDocumentTitle('設定')

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

  createEffect(() => {
    const section = normalizeSection(params.section)
    if (!section) {
      return
    }

    queueMicrotask(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

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
   * 確認チェック後にプレイヤーデータを削除する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDeletePlayerData = async () => {
    if (!playerDeleteConfirmed()) {
      return
    }

    setPlayerDataError('')
    setPlayerDataSuccess('')
    setPlayerDeleting(true)
    try {
      await deletePlayerData()
      setPlayerDeleteConfirmed(false)
      setPlayerDataSuccess('プレイヤーデータを削除しました。必要であれば再登録してください。')
      await refetchSummary()
    } catch (error) {
      setPlayerDataError(toUserFriendlyErrorMessage(error, 'プレイヤーデータ削除に失敗しました。'))
    } finally {
      setPlayerDeleting(false)
    }
  }

  /**
   * 確認チェック後にアカウントを退会処理し、ログイン画面へ遷移する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDeleteAccount = async () => {
    if (!accountDeleteConfirmed()) {
      return
    }

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
    <div class="mx-auto w-full max-w-5xl p-4 space-y-4">
      <h1 class="text-2xl font-semibold">設定</h1>
      <section id="appearance" class="py-4">
        <div class="rounded-xl border border-border bg-surface-muted p-4 sm:p-6">
          <h2 class="mb-4 text-lg font-semibold text-text">
            {APPEARANCE_SETTINGS_COPY.sectionTitle}
          </h2>
          <AppearanceSettings />
        </div>
      </section>
      <Show when={!summary.error} fallback={<LoadError error={summary.error} />}>
        <Show when={summary()} fallback={<Loading />}>
          {(loadedSummary) => (
            <>
              <dl class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-border bg-surface-muted p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    ユーザー名
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-text">
                    {loadedSummary().me.username}
                  </dd>
                </div>
                <div class="rounded-xl border border-border bg-surface-muted p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    アカウント種別
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-text">
                    {loadedSummary().me.account_type}
                  </dd>
                </div>
                <div class="rounded-xl border border-border bg-surface-muted p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    公開状態
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-text">
                    {loadedSummary().me.is_private ? '非公開' : '公開'}
                  </dd>
                </div>
                <div class="rounded-xl border border-border bg-surface-muted p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    プレイヤーデータ
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-text">
                    {loadedSummary().profile.player ? '連携済み' : '未連携'}
                  </dd>
                </div>
              </dl>

              <div class="mt-8 space-y-6">
                <div class="flex flex-col gap-6">
                  <section id="privacy" class="py-4">
                    <div class="flex flex-col gap-4">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 class="text-lg font-semibold text-text">非公開設定</h2>
                        </div>
                        <span
                          class={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                            privacyValue()
                              ? 'bg-warning-bg text-warning'
                              : 'bg-success-bg text-success'
                          }`}
                        >
                          現在: {privacyValue() ? '非公開' : '公開'}
                        </span>
                      </div>

                      <Switch
                        checked={privacyValue()}
                        onChange={handleTogglePrivacy}
                        disabled={privacySubmitting()}
                      >
                        <Switch.Input
                          aria-label={`プロフィールを${privacyValue() ? '公開' : '非公開'}にする`}
                        />
                        <Switch.Control
                          class={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition data-disabled:cursor-not-allowed data-disabled:opacity-60 ${
                            privacyValue()
                              ? 'border-warning-border bg-warning-bg hover:bg-warning-bg'
                              : 'border-success-border bg-success-bg hover:bg-success-bg'
                          }`}
                        >
                          <div class="pr-4">
                            <p class="text-sm font-semibold text-text">
                              {privacySubmitting() ? '更新中...' : 'プロフィール'}
                            </p>
                          </div>
                          <span
                            aria-hidden="true"
                            class={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                              privacyValue() ? 'bg-warning' : 'bg-success'
                            }`}
                          >
                            <Switch.Thumb
                              class={`inline-block h-6 w-6 rounded-full bg-surface shadow-sm transition ${
                                privacyValue() ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            />
                          </span>
                        </Switch.Control>
                      </Switch>

                      <Show when={privacyError()}>
                        <p class="text-sm text-danger" aria-live="polite">
                          {privacyError()}
                        </p>
                      </Show>
                      <Show when={privacySuccess()}>
                        <p class="text-sm text-action-primary" aria-live="polite">
                          {privacySuccess()}
                        </p>
                      </Show>
                    </div>
                  </section>

                  <ApiTokenSettingsSection username={loadedSummary().me.username} />
                </div>

                <DataTransferSettingsSection
                  onImported={async () => {
                    await refetchSummary()
                  }}
                />

                <section id="player-data" class="py-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-text">プレイヤーデータ</h2>
                      <p class="mt-1 text-sm text-text-muted">
                        登録済みプレイヤーデータの状態確認、再登録、連携解除を行います。
                      </p>
                    </div>
                    <span class="text-sm font-medium text-text-subtle">
                      最終更新: {formatSettingsDateTime(loadedSummary().me.last_score_update)}
                    </span>
                  </div>

                  <Show
                    when={loadedSummary().profile.player}
                    fallback={
                      <div class="mt-4 rounded-xl border border-dashed border-border-strong bg-surface-muted p-4">
                        <p class="text-sm font-medium text-text">
                          現在プレイヤーデータは連携されていません。
                        </p>
                        <p class="mt-1 text-sm text-text-muted">
                          スコアアップロード後に登録することで、プロフィールや統計に反映できます。
                        </p>
                      </div>
                    }
                  >
                    {(player) => (
                      <div class="mt-4 grid gap-4 sm:grid-cols-3">
                        <div class="rounded-xl border border-border bg-surface-muted p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                            プレイヤー名
                          </p>
                          <p class="mt-2 text-base font-semibold text-text">{player().name}</p>
                        </div>
                        <div class="rounded-xl border border-border bg-surface-muted p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                            レーティング
                          </p>
                          <p class="mt-2 text-base font-semibold text-text">
                            {formatRatingFixed2(player().rating)}
                          </p>
                        </div>
                        <div class="rounded-xl border border-border bg-surface-muted p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                            最終プレイ
                          </p>
                          <p class="mt-2 text-base font-semibold text-text">
                            {formatSettingsDateTime(player().last_played_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </Show>

                  <CheckboxField
                    checked={playerDeleteConfirmed()}
                    onChange={setPlayerDeleteConfirmed}
                    disabled={playerDeleting()}
                    label="上記の内容を理解し、プレイヤーデータを削除することに同意します"
                    class="mt-4 cursor-pointer gap-3"
                    controlClass="h-4 w-4"
                    indicatorClass="h-3 w-3"
                    labelClass="text-sm text-text-muted"
                  />

                  <Show when={playerDataError()}>
                    <p class="mt-3 text-sm text-danger" aria-live="polite">
                      {playerDataError()}
                    </p>
                  </Show>
                  <Show when={playerDataSuccess()}>
                    <p class="mt-3 text-sm text-action-primary" aria-live="polite">
                      {playerDataSuccess()}
                    </p>
                  </Show>

                  <AppButton
                    variant="danger"
                    class="mt-4 rounded-md"
                    onClick={handleDeletePlayerData}
                    disabled={!playerDeleteConfirmed() || playerDeleting()}
                  >
                    {playerDeleting() ? '削除中...' : 'プレイヤーデータを削除'}
                  </AppButton>
                </section>

                <section id="account-delete" class="py-4">
                  <div>
                    <h2 class="text-lg font-semibold text-danger">退会</h2>
                    <p class="mt-1 text-sm text-text-muted">
                      アカウントを完全に削除します。この操作は取り消せません。
                    </p>
                  </div>

                  <div class="mt-4 rounded-lg bg-danger-bg p-4">
                    <p class="text-sm font-medium text-danger">
                      退会すると以下のデータがすべて削除されます
                    </p>
                    <ul class="mt-2 list-inside list-disc text-sm text-danger">
                      <li>ユーザー情報</li>
                      <li>プレイヤーデータ・スコア記録</li>
                      <li>目標設定</li>
                      <li>APIトークン</li>
                    </ul>
                  </div>

                  <CheckboxField
                    checked={accountDeleteConfirmed()}
                    onChange={setAccountDeleteConfirmed}
                    disabled={accountDeleting()}
                    label="上記の内容を理解し、退会することに同意します"
                    class="mt-4 cursor-pointer gap-3"
                    controlClass="h-4 w-4"
                    indicatorClass="h-3 w-3"
                    labelClass="text-sm text-text-muted"
                  />

                  <Show when={accountDeleteError()}>
                    <p class="mt-3 text-sm text-danger" aria-live="polite">
                      {accountDeleteError()}
                    </p>
                  </Show>

                  <p class="mt-4 text-xs text-text-subtle">
                    退会ボタンを押すと、本人確認のためGoogleアカウントでの再認証が求められます。
                  </p>

                  <AppButton
                    variant="danger"
                    class="mt-3 rounded-md"
                    onClick={handleDeleteAccount}
                    disabled={!accountDeleteConfirmed() || accountDeleting()}
                  >
                    {accountDeleting() ? '処理中...' : '退会する'}
                  </AppButton>
                </section>
              </div>
            </>
          )}
        </Show>
      </Show>
    </div>
  )
}

export default Settings
