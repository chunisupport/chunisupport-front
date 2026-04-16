import { A, useNavigate, useParams } from '@solidjs/router'
import { createEffect, createResource, createSignal, Show } from 'solid-js'
import {
  deleteAccount,
  deleteApiToken,
  deletePlayerData,
  fetchPrivacy,
  issueApiToken,
  updatePrivacy,
} from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { authSession, clearAuthenticatedUser } from '../../stores/authSession'

const SECTION_IDS = ['privacy', 'api-token', 'player-data', 'account-delete'] as const

type SectionId = (typeof SECTION_IDS)[number]

type SettingsSummary = {
  me: Awaited<ReturnType<typeof fetchMe>>
  profile: Awaited<ReturnType<typeof fetchUserProfileSummary>>
}

const accountTypeLabelMap = {
  PLAYER: 'プレイヤー',
  EDITOR: 'エディター',
  ADMIN: '管理者',
} as const

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

  const handleSavePrivacy = async () => {
    setPrivacyError('')
    setPrivacySuccess('')
    setPrivacySubmitting(true)
    try {
      const result = await updatePrivacy(privacyValue())
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
      setApiTokenSuccess('APIトークンを発行しました。表示はこの1回のみです。')
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
      setApiTokenSuccess('APIトークンを削除しました。')
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
    <div class="mx-auto w-full max-w-5xl p-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 class="text-2xl font-semibold">設定</h1>
        <p class="mt-2 text-sm text-gray-600">
          アカウント状態の確認と、プライバシー・連携・危険操作をこのページで管理できます。
        </p>

        <Show when={normalizeSection(params.section)}>
          <p class="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            個別設定ページは統合されました。該当セクションまで自動で移動します。
          </p>
        </Show>

        <Show
          when={summary()}
          fallback={<p class="mt-6 text-sm text-gray-600">設定情報を読み込み中です...</p>}
        >
          {(loadedSummary) => (
            <>
              <dl class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    ユーザー名
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-gray-900">
                    {loadedSummary().me.username}
                  </dd>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    アカウント種別
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-gray-900">
                    {accountTypeLabelMap[loadedSummary().me.account_type]}
                  </dd>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    公開状態
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-gray-900">
                    {loadedSummary().me.is_private ? '非公開' : '公開'}
                  </dd>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    プレイヤーデータ
                  </dt>
                  <dd class="mt-2 text-base font-semibold text-gray-900">
                    {loadedSummary().profile.player ? '連携済み' : '未連携'}
                  </dd>
                </div>
              </dl>

              <div class="mt-6 flex flex-wrap gap-2">
                <A
                  href="/settings/privacy"
                  class="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  非公開設定
                </A>
                <A
                  href="/settings/api-token"
                  class="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  APIトークン
                </A>
                <A
                  href="/settings/player-data"
                  class="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  プレイヤーデータ
                </A>
                <A
                  href="/settings/account-delete"
                  class="rounded-full border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  退会
                </A>
              </div>

              <div class="mt-8 space-y-6">
                <section id="privacy" class="rounded-2xl border border-gray-200 bg-white p-5">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900">非公開設定</h2>
                      <p class="mt-1 text-sm text-gray-600">
                        プロフィールページの公開状態を切り替えます。
                      </p>
                    </div>
                    <span class="text-sm font-medium text-gray-500">
                      現在: {loadedSummary().me.is_private ? '非公開' : '公開'}
                    </span>
                  </div>

                  <label class="mt-4 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={privacyValue()}
                      onChange={(event) => setPrivacyValue(event.currentTarget.checked)}
                      disabled={privacySubmitting()}
                      class="h-4 w-4"
                    />
                    <span class="text-sm text-gray-700">プロフィールを非公開にする</span>
                  </label>

                  <Show when={privacyError()}>
                    <p class="mt-3 text-sm text-red-600" aria-live="polite">
                      {privacyError()}
                    </p>
                  </Show>
                  <Show when={privacySuccess()}>
                    <p class="mt-3 text-sm text-primary-600" aria-live="polite">
                      {privacySuccess()}
                    </p>
                  </Show>

                  <button
                    type="button"
                    onClick={handleSavePrivacy}
                    disabled={privacySubmitting()}
                    class="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {privacySubmitting() ? '更新中...' : '保存する'}
                  </button>
                </section>

                <section id="api-token" class="rounded-2xl border border-gray-200 bg-white p-5">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900">APIトークン管理</h2>
                      <p class="mt-1 text-sm text-gray-600">
                        外部連携用の API
                        トークンを発行・削除します。トークン文字列は発行時にのみ確認できます。
                      </p>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleIssueApiToken}
                      disabled={apiTokenIssuing()}
                      class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {apiTokenIssuing() ? '発行中...' : 'APIトークンを発行'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteApiToken}
                      disabled={apiTokenDeleting()}
                      class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {apiTokenDeleting() ? '削除中...' : 'APIトークンを削除'}
                    </button>
                  </div>

                  <Show when={apiTokenError()}>
                    <p class="mt-3 text-sm text-red-600" aria-live="polite">
                      {apiTokenError()}
                    </p>
                  </Show>
                  <Show when={apiTokenSuccess()}>
                    <p class="mt-3 text-sm text-primary-600" aria-live="polite">
                      {apiTokenSuccess()}
                    </p>
                  </Show>

                  <Show when={token()}>
                    <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p class="text-sm font-medium text-gray-700">発行されたAPIトークン</p>
                      <p class="mt-2 break-all rounded border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800">
                        {token()}
                      </p>
                      <div class="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyToken}
                          class="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          コピー
                        </button>
                        <Show when={copied()}>
                          <span class="text-xs text-primary-600">コピーしました</span>
                        </Show>
                      </div>
                    </div>
                  </Show>
                </section>

                <section id="player-data" class="rounded-2xl border border-gray-200 bg-white p-5">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900">プレイヤーデータ</h2>
                      <p class="mt-1 text-sm text-gray-600">
                        登録済みプレイヤーデータの状態確認、再登録、連携解除を行います。
                      </p>
                    </div>
                    <span class="text-sm font-medium text-gray-500">
                      最終更新: {formatDateTime(loadedSummary().me.last_score_update)}
                    </span>
                  </div>

                  <Show
                    when={loadedSummary().profile.player}
                    fallback={
                      <div class="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                        <p class="text-sm font-medium text-gray-800">
                          現在プレイヤーデータは連携されていません。
                        </p>
                        <p class="mt-1 text-sm text-gray-600">
                          スコアアップロード後に登録することで、プロフィールや統計に反映できます。
                        </p>
                      </div>
                    }
                  >
                    {(player) => (
                      <div class="mt-4 grid gap-4 sm:grid-cols-3">
                        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            プレイヤー名
                          </p>
                          <p class="mt-2 text-base font-semibold text-gray-900">{player().name}</p>
                        </div>
                        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            レーティング
                          </p>
                          <p class="mt-2 text-base font-semibold text-gray-900">
                            {player().rating.toFixed(2)}
                          </p>
                        </div>
                        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            最終プレイ
                          </p>
                          <p class="mt-2 text-base font-semibold text-gray-900">
                            {formatDateTime(player().last_played_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </Show>

                  <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p class="text-sm font-medium text-amber-900">
                      削除すると `players` / `player_records` / `player_worldsend_records` /
                      `player_honors` が削除されます。
                    </p>
                    <p class="mt-1 text-sm text-amber-800">
                      ユーザーアカウント自体は残ります。削除後は `/register-score-temp`
                      から再登録できます。
                    </p>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <A
                      href="/register-score-temp"
                      class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
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
                    <span class="text-sm text-gray-700">
                      上記の内容を理解し、プレイヤーデータを削除することに同意します
                    </span>
                  </label>

                  <Show when={playerDataError()}>
                    <p class="mt-3 text-sm text-red-600" aria-live="polite">
                      {playerDataError()}
                    </p>
                  </Show>
                  <Show when={playerDataSuccess()}>
                    <p class="mt-3 text-sm text-primary-600" aria-live="polite">
                      {playerDataSuccess()}
                    </p>
                  </Show>

                  <button
                    type="button"
                    onClick={handleDeletePlayerData}
                    disabled={!playerDeleteConfirmed() || playerDeleting()}
                    class="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {playerDeleting() ? '削除中...' : 'プレイヤーデータを削除'}
                  </button>
                </section>

                <section
                  id="account-delete"
                  class="rounded-2xl border border-red-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <h2 class="text-lg font-semibold text-red-800">退会</h2>
                    <p class="mt-1 text-sm text-gray-600">
                      アカウントを完全に削除します。この操作は取り消せません。
                    </p>
                  </div>

                  <div class="mt-4 rounded-lg bg-red-50 p-4">
                    <p class="text-sm font-medium text-red-800">
                      退会すると以下のデータがすべて削除されます
                    </p>
                    <ul class="mt-2 list-inside list-disc text-sm text-red-700">
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
                    <span class="text-sm text-gray-700">
                      上記の内容を理解し、退会することに同意します
                    </span>
                  </label>

                  <Show when={accountDeleteError()}>
                    <p class="mt-3 text-sm text-red-600" aria-live="polite">
                      {accountDeleteError()}
                    </p>
                  </Show>

                  <p class="mt-4 text-xs text-gray-500">
                    退会ボタンを押すと、本人確認のためGoogleアカウントでの再認証が求められます。
                  </p>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={!accountDeleteConfirmed() || accountDeleting()}
                    class="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accountDeleting() ? '処理中...' : '退会する'}
                  </button>
                </section>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}

export default Settings
