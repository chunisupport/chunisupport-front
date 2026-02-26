import { createSignal } from 'solid-js'
import { postRecoveryReset } from '../../../api/auth'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

const RecoveryReset = () => {
  const [recoveryCode, setRecoveryCode] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('リカバリーコードで再設定')

  const handleSubmit = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!recoveryCode() || !newPassword()) {
      setErrorMessage('リカバリーコードと新しいパスワードを入力してください。')
      return
    }

    setIsSubmitting(true)
    try {
      await postRecoveryReset({
        recovery_code: recoveryCode(),
        new_password: newPassword(),
      })
      setRecoveryCode('')
      setNewPassword('')
      setSuccessMessage('パスワードを再設定しました。ログイン画面から再ログインしてください。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'パスワード再設定に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class="min-h-screen flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="text-center mb-6">
          <p class="text-gray-600 mb-2">ChuniSupport</p>
          <h1 class="text-2xl font-semibold">リカバリーコードでパスワード再設定</h1>
          <p class="mt-2 text-sm text-gray-600">
            未ログイン状態で使える再設定機能です。コードは{' '}
            <span class="font-mono">XXXX-XXXX-XXXX</span> 形式で入力してください。
          </p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label for="recovery-code" class="mb-2 block text-sm font-medium text-gray-700">
            リカバリーコード
          </label>
          <input
            id="recovery-code"
            type="text"
            value={recoveryCode()}
            onInput={(event) => setRecoveryCode(event.currentTarget.value.toUpperCase())}
            placeholder="A1B2-C3D4-E5F6"
            class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <label for="recovery-new-password" class="mb-2 block text-sm font-medium text-gray-700">
            新しいパスワード
          </label>
          <input
            id="recovery-new-password"
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
            class="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting() ? '再設定中...' : '再設定する'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecoveryReset
