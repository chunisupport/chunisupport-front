import { A } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'
import { fetchPrivacy, updatePrivacy } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsPrivacyPage = () => {
  const [isPrivate, setIsPrivate] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('非公開設定')

  onMount(async () => {
    setErrorMessage('')
    try {
      const result = await fetchPrivacy()
      setIsPrivate(result.is_private)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '現在の設定取得に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  })

  const handleSubmit = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      const result = await updatePrivacy(isPrivate())
      setIsPrivate(result.is_private)
      setSuccessMessage('非公開設定を更新しました。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '設定更新に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">非公開設定</h1>
      <p class="mt-2 text-sm text-gray-600">プロフィール公開状態を切り替えます。</p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isPrivate()}
            onChange={(event) => setIsPrivate(event.currentTarget.checked)}
            disabled={isLoading() || isSubmitting()}
            class="h-4 w-4"
          />
          <span class="text-sm text-gray-700">プロフィールを非公開にする</span>
        </label>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-green-600">{successMessage()}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading() || isSubmitting()}
          class="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading() ? '読み込み中...' : isSubmitting() ? '更新中...' : '保存する'}
        </button>
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

export default SettingsPrivacyPage
