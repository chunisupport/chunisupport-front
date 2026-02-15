import { A } from '@solidjs/router'
import { createSignal } from 'solid-js'
import { deleteApiToken, issueApiToken } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsApiTokenPage = () => {
  const [token, setToken] = createSignal('')
  const [isIssuing, setIsIssuing] = createSignal(false)
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')
  const [copied, setCopied] = createSignal(false)

  useDocumentTitle('APIトークン管理')

  const handleIssue = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsIssuing(true)
    try {
      const result = await issueApiToken()
      setToken(result.token)
      setSuccessMessage('APIトークンを発行しました。表示はこの1回のみです。')
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
      setSuccessMessage('APIトークンを削除しました。')
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
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleIssue}
            disabled={isIssuing()}
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isIssuing() ? '発行中...' : 'APIトークンを発行'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting()}
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting() ? '削除中...' : 'APIトークンを削除'}
          </button>
        </div>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-green-600">{successMessage()}</p>}

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
              {copied() && <span class="text-xs text-green-600">コピーしました</span>}
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

export default SettingsApiTokenPage
