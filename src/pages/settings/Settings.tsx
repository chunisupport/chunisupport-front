import { A, useNavigate, useParams } from '@solidjs/router'
import { createEffect, createResource, createSignal, Show } from 'solid-js'
import {
  deleteAccount,
  deleteApiToken,
  deletePlayerData,
  fetchApiTokenStatus,
  fetchPrivacy,
  issueApiToken,
  updatePrivacy,
} from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { authSession, clearAuthenticatedUser } from '../../stores/authSession'

const SECTION_IDS = ['privacy', 'api-token', 'player-data', 'account-delete'] as const

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

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '未登録'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '未登録'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * ユーザー設定画面を表示する。
 *
 * @returns 設定画面のJSX要素。
 */
const Settings = () => {
  const navigate = useNavigate()
  const params = useParams<{ section?: string }>()
  const [token, setToken] = createSignal('')
  const [copied, setCopied] = createSignal(false)
  const [privacyValue, setPrivacyValue] = createSignal(false)
  const [privacySubmitting, setPrivacySubmitting] = createSignal(false)
  const [privacyError, setPrivacyError] = createSignal('')
  const [privacySuccess, setPrivacySuccess] = createSignal('')
  const [apiTokenIssuing, setApiTokenIssuing] = createSignal(false)
  const [apiTokenDeleting, setApiTokenDeleting] = createSignal(false)
  const [apiTokenError, setApiTokenError] = createSignal('')
  const [apiTokenSuccess, setApiTokenSuccess] = createSignal('')
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
  const [apiTokenStatus, { refetch: refetchApiTokenStatus }] = createResource(
    () => authSession.user?.username,
    async () => fetchApiTokenStatus()
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

  const handleTogglePrivacy = async () => {
    setPrivacyError('')
    setPrivacySuccess('')
    const nextValue = !privacyValue()
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
      setPrivacyError(error instanceof Error ? error.message : '設定更新に失敗しました。')
      await handlePrivacyRefresh()
    } finally {
      setPrivacySubmitting(false)
    }
  }

  const handleIssueApiToken = async () => {
    setApiTokenError('')
    setApiTokenSuccess('')
    setApiTokenIssuing(true)
    try {
      const result = await issueApiToken()
      setToken(result.token)
      setCopied(false)
      setApiTokenSuccess('APIトークンを発行しました。表示はこの1回のみです。')
      await refetchApiTokenStatus()
    } catch (error) {
      setApiTokenError(error instanceof Error ? error.message : 'APIトークン発行に失敗しました。')
    } finally {
      setApiTokenIssuing(false)
    }
  }

  const handleDeleteApiToken = async () => {
    setApiTokenError('')
    setApiTokenSuccess('')
    if (!window.confirm('現在のAPIトークンを削除します。よろしいですか？')) {
      return
    }

    setApiTokenDeleting(true)
    try {
      await deleteApiToken()
      setToken('')
      setCopied(false)
      setApiTokenSuccess('APIトークンを削除しました。')
      await refetchApiTokenStatus()
    } catch (error) {
      setApiTokenError(error instanceof Error ? error.message : 'APIトークン削除に失敗しました。')
    } finally {
      setApiTokenDeleting(false)
    }
  }

  const handleCopyToken = async () => {
    if (!token()) {
      return
    }

    try {
      await navigator.clipboard.writeText(token())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setApiTokenError('コピーに失敗しました。手動でコピーしてください。')
    }
  }

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
      setPlayerDataError(
        error instanceof Error ? error.message : 'プレイヤーデータ削除に失敗しました。'
      )
    } finally {
      setPlayerDeleting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountDeleteConfirmed()) {
      return
    }

    setAccountDeleteError('')
    setAccountDeleting(true)
    try {
      await deleteAccount()
      await auth.signOut()
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
        setAccountDeleteError(err.message || '退会処理に失敗しました。')
      }
    } finally {
      setAccountDeleting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-5xl p-4 space-y-4">
      <h1 class="text-2xl font-semibold">設定</h1>
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

                      <button
                        type="button"
                        role="switch"
                        aria-checked={privacyValue()}
                        aria-label={`プロフィールを${privacyValue() ? '公開' : '非公開'}にする`}
                        onClick={handleTogglePrivacy}
                        disabled={privacySubmitting()}
                        class={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                          <span
                            class={`inline-block h-6 w-6 rounded-full bg-surface shadow-sm transition ${
                              privacyValue() ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </span>
                      </button>

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

                  <section id="api-token" class="py-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 class="text-lg font-semibold text-text">APIトークン管理</h2>
                        <p class="mt-1 text-sm text-text-muted">
                          外部連携用の API
                          トークンを発行・削除します。トークン文字列は発行時にのみ確認できます。
                        </p>
                      </div>
                      <Show
                        when={apiTokenStatus()}
                        fallback={
                          <Show
                            when={apiTokenStatus.error}
                            fallback={
                              <span class="inline-flex w-fit rounded-full bg-surface-hover px-3 py-1 text-sm font-semibold text-text-muted">
                                状態を確認中...
                              </span>
                            }
                          >
                            <span class="inline-flex w-fit rounded-full bg-danger-bg px-3 py-1 text-sm font-semibold text-danger">
                              状態取得に失敗
                            </span>
                          </Show>
                        }
                      >
                        {(status) => (
                          <span
                            class={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                              status().has_token
                                ? 'bg-success-bg text-success'
                                : 'bg-surface-hover text-text-muted'
                            }`}
                          >
                            現在: {status().has_token ? '発行済み' : '未発行'}
                          </span>
                        )}
                      </Show>
                    </div>

                    <Show when={apiTokenStatus()}>
                      {(status) => (
                        <div class="mt-4 rounded-lg border border-border bg-surface-muted p-4">
                          <p class="text-sm font-medium text-text">
                            {status().has_token
                              ? '現在有効なAPIトークンが発行されています。'
                              : '現在有効なAPIトークンは発行されていません。'}
                          </p>
                          <Show when={status().has_token}>
                            <p class="mt-1 text-sm text-text-muted">
                              発行日時: {formatDateTime(status().created_at)}
                            </p>
                          </Show>
                        </div>
                      )}
                    </Show>

                    <div class="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleIssueApiToken}
                        disabled={apiTokenIssuing()}
                        class="rounded-md bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {apiTokenIssuing()
                          ? '発行中...'
                          : apiTokenStatus()?.has_token
                            ? 'APIトークンを再発行'
                            : 'APIトークンを発行'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteApiToken}
                        disabled={apiTokenDeleting() || !apiTokenStatus()?.has_token}
                        class="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {apiTokenDeleting() ? '削除中...' : 'APIトークンを削除'}
                      </button>
                    </div>

                    <Show when={apiTokenError()}>
                      <p class="mt-3 text-sm text-danger" aria-live="polite">
                        {apiTokenError()}
                      </p>
                    </Show>
                    <Show when={apiTokenSuccess()}>
                      <p class="mt-3 text-sm text-action-primary" aria-live="polite">
                        {apiTokenSuccess()}
                      </p>
                    </Show>

                    <Show when={token()}>
                      <div class="mt-4 rounded-lg border border-border bg-surface-muted p-4">
                        <p class="text-sm font-medium text-text-muted">発行されたAPIトークン</p>
                        <p class="mt-2 break-all rounded border border-border bg-surface p-2 font-mono text-xs text-text">
                          {token()}
                        </p>
                        <div class="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyToken}
                            class="rounded-md bg-border-strong px-3 py-1.5 text-xs font-semibold text-text-inverse hover:bg-surface-hover"
                          >
                            コピー
                          </button>
                          <Show when={copied()}>
                            <span class="text-xs text-action-primary">コピーしました</span>
                          </Show>
                        </div>
                      </div>
                    </Show>
                  </section>
                </div>

                <section id="player-data" class="py-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-text">プレイヤーデータ</h2>
                      <p class="mt-1 text-sm text-text-muted">
                        登録済みプレイヤーデータの状態確認、再登録、連携解除を行います。
                      </p>
                    </div>
                    <span class="text-sm font-medium text-text-subtle">
                      最終更新: {formatDateTime(loadedSummary().me.last_score_update)}
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
                            {player().rating.toFixed(2)}
                          </p>
                        </div>
                        <div class="rounded-xl border border-border bg-surface-muted p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                            最終プレイ
                          </p>
                          <p class="mt-2 text-base font-semibold text-text">
                            {formatDateTime(player().last_played_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </Show>

                  <div class="mt-4 rounded-lg border border-warning-border bg-warning-bg p-4">
                    <p class="text-sm font-medium text-warning">
                      削除すると `players` / `player_records` / `player_worldsend_records` /
                      `player_honors` が削除されます。
                    </p>
                    <p class="mt-1 text-sm text-warning">
                      ユーザーアカウント自体は残ります。削除後は `/register-score-temp`
                      から再登録できます。
                    </p>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <A
                      href="/register-score-temp"
                      class="rounded-md bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover"
                    >
                      プレイヤーデータを登録する
                    </A>
                  </div>

                  <label class="mt-4 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={playerDeleteConfirmed()}
                      onChange={(event) => setPlayerDeleteConfirmed(event.currentTarget.checked)}
                      disabled={playerDeleting()}
                      class="h-4 w-4"
                    />
                    <span class="text-sm text-text-muted">
                      上記の内容を理解し、プレイヤーデータを削除することに同意します
                    </span>
                  </label>

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

                  <button
                    type="button"
                    onClick={handleDeletePlayerData}
                    disabled={!playerDeleteConfirmed() || playerDeleting()}
                    class="mt-4 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {playerDeleting() ? '削除中...' : 'プレイヤーデータを削除'}
                  </button>
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

                  <label class="mt-4 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={accountDeleteConfirmed()}
                      onChange={(event) => setAccountDeleteConfirmed(event.currentTarget.checked)}
                      disabled={accountDeleting()}
                      class="h-4 w-4"
                    />
                    <span class="text-sm text-text-muted">
                      上記の内容を理解し、退会することに同意します
                    </span>
                  </label>

                  <Show when={accountDeleteError()}>
                    <p class="mt-3 text-sm text-danger" aria-live="polite">
                      {accountDeleteError()}
                    </p>
                  </Show>

                  <p class="mt-4 text-xs text-text-subtle">
                    退会ボタンを押すと、本人確認のためGoogleアカウントでの再認証が求められます。
                  </p>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={!accountDeleteConfirmed() || accountDeleting()}
                    class="mt-3 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accountDeleting() ? '処理中...' : '退会する'}
                  </button>
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
