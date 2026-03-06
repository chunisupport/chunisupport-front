import { A } from '@solidjs/router'
import { createSignal, For } from 'solid-js'
import { issueRecoveryCodes } from '../../api/settings'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SettingsRecoveryCodesPage = () => {
  const [codes, setCodes] = createSignal<string[]>([])
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')
  const [copied, setCopied] = createSignal(false)

  useDocumentTitle('リカバリーコード発行')

  const handleIssue = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      const result = await issueRecoveryCodes()
      setCodes(result.recovery_codes)
      setSuccessMessage('新しいリカバリーコードを発行しました。必ず保存してください。')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'リカバリーコード発行に失敗しました。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    const text = codes().join('\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMessage('コピーに失敗しました。手動でコピーしてください。')
    }
  }

  return (
    <div class="mx-auto w-full max-w-2xl p-6">
      <h1 class="text-2xl font-semibold">リカバリーコード発行</h1>
      <p class="mt-2 text-sm text-gray-600">
        発行済みコードは再表示できません。発行後すぐに安全な場所へ保存してください。
      </p>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={handleIssue}
          disabled={isSubmitting()}
          class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting() ? '発行中...' : 'リカバリーコードを発行'}
        </button>

        {errorMessage() && <p class="mt-3 text-sm text-red-600">{errorMessage()}</p>}
        {successMessage() && <p class="mt-3 text-sm text-primary-600">{successMessage()}</p>}

        {codes().length > 0 && (
          <div class="mt-4 rounded-md bg-gray-50 p-3">
            <p class="mb-2 text-sm font-medium text-gray-700">発行されたコード</p>
            <ul class="space-y-1 text-sm font-mono text-gray-800">
              <For each={codes()}>{(code) => <li>{code}</li>}</For>
            </ul>
            <div class="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                class="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                一括コピー
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

export default SettingsRecoveryCodesPage
