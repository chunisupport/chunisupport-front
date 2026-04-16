import { A, useNavigate } from '@solidjs/router'
import { createSignal } from 'solid-js'
import { deleteAccount } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { clearAuthenticatedUser } from '../../stores/authSession'

const SettingsAccountDelete = () => {
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [confirmed, setConfirmed] = createSignal(false)

  useDocumentTitle('退会')

  const handleDelete = async () => {
    if (!confirmed()) return
    setErrorMessage('')
    setIsDeleting(true)
    try {
      await deleteAccount()
      await auth.signOut()
      clearAuthenticatedUser()
      navigate('/login', { replace: true })
    } catch (error) {
      const err = error as Error & { code?: string }
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('再認証がキャンセルされました。')
      } else if (err.code === 'auth/user-mismatch') {
        setErrorMessage('ログイン中のアカウントと異なるアカウントで再認証されました。')
      } else if (err.code === 'recent_sign_in_required') {
        setErrorMessage('再認証の有効期限が切れています。もう一度お試しください。')
      } else {
        setErrorMessage(err.message || '退会処理に失敗しました。')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">退会</h1>
      <p class="mt-2 text-sm text-gray-600">
        アカウントを完全に削除します。この操作は取り消せません。
      </p>

      <div class="mt-6 rounded-lg border border-red-200 bg-white p-4 shadow-sm">
        <div class="mb-4 rounded-md bg-red-50 p-3">
          <p class="text-sm font-medium text-red-800">退会すると以下のデータがすべて削除されます</p>
          <ul class="mt-2 list-inside list-disc text-sm text-red-700">
            <li>ユーザー情報</li>
            <li>プレイヤーデータ・スコア記録</li>
            <li>目標設定</li>
            <li>APIトークン</li>
          </ul>
        </div>

        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={confirmed()}
            onChange={(event) => setConfirmed(event.currentTarget.checked)}
            disabled={isDeleting()}
            class="h-4 w-4"
          />
          <span class="text-sm text-gray-700">上記の内容を理解し、退会することに同意します</span>
        </label>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}

        <p class="mt-4 text-xs text-gray-500">
          退会ボタンを押すと、本人確認のためGoogleアカウントでの再認証が求められます。
        </p>

        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmed() || isDeleting()}
          class="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting() ? '処理中...' : '退会する'}
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

export default SettingsAccountDelete
