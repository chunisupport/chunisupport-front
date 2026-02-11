import { createSignal, onMount } from 'solid-js'
import { fetchSessionCount, logoutOtherSessions } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsSessionsPage = () => {
  const [sessionCount, setSessionCount] = createSignal<number | null>(null)
  const [isLoading, setIsLoading] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('セッション管理')

  const loadSessionCount = async () => {
    setIsLoading(true)
    try {
      const result = await fetchSessionCount()
      setSessionCount(result.count)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'セッション情報の取得に失敗しました。'
      )
    } finally {
      setIsLoading(false)
    }
  }

  onMount(async () => {
    await loadSessionCount()
  })

  const handleLogoutOthers = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if ((sessionCount() ?? 0) <= 1) {
      setSuccessMessage('現在の端末以外に有効なセッションはありません。')
      return
    }

    if (!window.confirm('現在の端末以外をすべてログアウトします。よろしいですか？')) {
      return
    }

    setIsSubmitting(true)
    try {
      await logoutOtherSessions()
      setSuccessMessage('他端末をログアウトしました。')
      await loadSessionCount()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '他端末ログアウトに失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">セッション管理</h1>
      <p class="mt-2 text-sm text-gray-600">
        現在のログイン端末数を確認し、他端末をログアウトできます。
      </p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-gray-700">
          有効セッション数:{' '}
          <span class="font-semibold">
            {isLoading() ? '読み込み中...' : (sessionCount() ?? '-')}
          </span>
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSessionCount}
            disabled={isLoading()}
            class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading() ? '更新中...' : '再読み込み'}
          </button>

          <button
            type="button"
            onClick={handleLogoutOthers}
            disabled={isSubmitting()}
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting() ? '処理中...' : '他端末をログアウト'}
          </button>
        </div>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-green-600">{successMessage()}</p>}
      </div>
    </div>
  )
}

export default SettingsSessionsPage
