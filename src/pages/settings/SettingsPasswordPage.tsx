import { A } from '@solidjs/router'
import { createSignal } from 'solid-js'
import { updatePassword } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsPasswordPage = () => {
  const [currentPassword, setCurrentPassword] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('パスワード変更')

  const handleSubmit = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentPassword() || !newPassword()) {
      setErrorMessage('現在のパスワードと新しいパスワードを入力してください。')
      return
    }

    setIsSubmitting(true)
    try {
      await updatePassword({
        current_password: currentPassword(),
        new_password: newPassword(),
      })
      setCurrentPassword('')
      setNewPassword('')
      setSuccessMessage('パスワードを変更しました。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'パスワード変更に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">パスワード変更</h1>
      <p class="mt-2 text-sm text-gray-600">現在のパスワードを確認してから変更します。</p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label for="current-password" class="mb-2 block text-sm font-medium text-gray-700">
          現在のパスワード
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword()}
          onInput={(event) => setCurrentPassword(event.currentTarget.value)}
          class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <label for="new-password" class="mb-2 block text-sm font-medium text-gray-700">
          新しいパスワード
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword()}
          onInput={(event) => setNewPassword(event.currentTarget.value)}
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-green-600">{successMessage()}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting()}
          class="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting() ? '変更中...' : '変更する'}
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

export default SettingsPasswordPage
