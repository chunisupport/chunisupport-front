import { createSignal } from 'solid-js'
import { updatePrivacy } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsPrivacyPage = () => {
  const [isPrivate, setIsPrivate] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('非公開設定')

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
            class="h-4 w-4"
          />
          <span class="text-sm text-gray-700">プロフィールを非公開にする</span>
        </label>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-green-600">{successMessage()}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting()}
          class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting() ? '更新中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}

export default SettingsPrivacyPage
