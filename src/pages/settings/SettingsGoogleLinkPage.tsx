import { signInWithPopup } from 'firebase/auth'
import { createSignal } from 'solid-js'
import { linkFirebaseAccount } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth, googleProvider } from '../../lib/firebase'

const SettingsGoogleLinkPage = () => {
  const [isLinking, setIsLinking] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  useDocumentTitle('Googleアカウント連携')

  const handleLink = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsLinking(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      await linkFirebaseAccount(idToken)
      setSuccessMessage('Googleアカウントと連携しました。')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Googleアカウント連携に失敗しました。')
      }
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">Googleアカウント連携</h1>
      <p class="mt-2 text-sm text-gray-600">
        Googleアカウントを連携することで、Googleログインが利用できるようになります。
      </p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p class="mb-4 text-sm text-gray-700">
          「Googleでログイン」ボタンを押すとポップアップが開きます。連携するGoogleアカウントを選択してください。
        </p>

        <button
          type="button"
          onClick={handleLink}
          disabled={isLinking()}
          class="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"
            />
            <path
              fill="#FBBC05"
              d="M10.8 28.8A14.4 14.4 0 0 1 10 24c0-1.7.3-3.3.8-4.8v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l8.1-6z"
            />
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.8 0 6.7 5.1 2.7 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z"
            />
          </svg>
          {isLinking() ? '連携中...' : 'Googleアカウントと連携する'}
        </button>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-primary-600">{successMessage()}</p>}
      </div>
    </div>
  )
}

export default SettingsGoogleLinkPage
