import { A } from '@solidjs/router'
import { createResource, createSignal } from 'solid-js'
import { deleteApiToken, fetchApiTokenStatus, issueApiToken } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'

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

const SettingsApiToken = () => {
  const [token, setToken] = createSignal('')
  const [isIssuing, setIsIssuing] = createSignal(false)
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')
  const [copied, setCopied] = createSignal(false)
  const [apiTokenStatus, { refetch: refetchApiTokenStatus }] = createResource(
    () => authSession.user?.username,
    async () => fetchApiTokenStatus()
  )

  useDocumentTitle('APIトークン管理')

  const handleIssue = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsIssuing(true)
    try {
      const result = await issueApiToken()
      setToken(result.token)
      setCopied(false)
      setSuccessMessage('APIトークンを発行しました。表示はこの1回のみです。')
      await refetchApiTokenStatus()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'APIトークン発行に失敗しました。')
    } finally {
      setIsIssuing(false)
    }
  }

  const handleDelete = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    if (!window.confirm('現在のAPIトークンを削除します。よろしいですか？')) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteApiToken()
      setToken('')
      setCopied(false)
      setSuccessMessage('APIトークンを削除しました。')
      await refetchApiTokenStatus()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'APIトークン削除に失敗しました。')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopy = async () => {
    if (!token()) return
    try {
      await navigator.clipboard.writeText(token())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMessage('コピーに失敗しました。手動でコピーしてください。')
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">APIトークン管理</h1>
      <p class="mt-2 text-sm text-gray-600">
        APIトークンは外部連携に使います。トークン文字列は発行時にのみ取得できます。
      </p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-medium text-gray-800">
              {apiTokenStatus.loading
                ? 'APIトークン状態を確認中です。'
                : apiTokenStatus()?.has_token
                  ? '現在有効なAPIトークンが発行されています。'
                  : '現在有効なAPIトークンは発行されていません。'}
            </p>
            {apiTokenStatus()?.has_token && (
              <p class="mt-1 text-sm text-gray-600">
                発行日時: {formatDateTime(apiTokenStatus()?.created_at ?? null)}
              </p>
            )}
            {apiTokenStatus()?.has_token && !token() && (
              <p class="mt-1 text-sm text-gray-600">
                セキュリティ上、トークン文字列は再表示できません。必要な場合は再発行してください。
              </p>
            )}
          </div>
          <span
            class={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
              apiTokenStatus()?.has_token
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {apiTokenStatus.loading
              ? '状態を確認中...'
              : apiTokenStatus()?.has_token
                ? '発行済み'
                : '未発行'}
          </span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleIssue}
            disabled={isIssuing()}
            class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isIssuing()
              ? '発行中...'
              : apiTokenStatus()?.has_token
                ? 'APIトークンを再発行'
                : 'APIトークンを発行'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting() || !apiTokenStatus()?.has_token}
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting() ? '削除中...' : 'APIトークンを削除'}
          </button>
        </div>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-primary-600">{successMessage()}</p>}

        {token() && (
          <div class="mt-4 rounded-md bg-gray-50 p-3">
            <p class="mb-2 text-sm font-medium text-gray-700">発行されたAPIトークン</p>
            <p class="break-all rounded border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800">
              {token()}
            </p>
            <div class="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                class="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                コピー
              </button>
              {copied() && <span class="text-xs text-primary-600">コピーしました</span>}
            </div>
          </div>
        )}
      </div>
      <A
        href="/settings"
        class="mt-4 inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        設定に戻る
      </A>
    </div>
  )
}

export default SettingsApiToken
