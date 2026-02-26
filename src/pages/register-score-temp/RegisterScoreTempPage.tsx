import { createSignal, Show } from 'solid-js'

import { postRegisterData } from '../../api/register-data'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

type RegisterDataFormat = 'json' | 'text'

const MAX_FILE_SIZE = 5 * 1024 * 1024

type UploadFormat = 'json' | 'text'

const formatLabelMap: Record<UploadFormat, string> = {
  json: 'JSON (debug)',
  text: 'TXT (base64+gzip)',
}

const RegisterScoreTempPage = () => {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null)
  const [format, setFormat] = createSignal<UploadFormat | null>(null)
  const [errorMessage, setErrorMessage] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [copied, setCopied] = createSignal(false)

  const resetMessages = () => {
    setErrorMessage('')
    setSuccessMessage('')
  }

  const detectFormat = (file: File): UploadFormat | null => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension === 'json') {
      return 'json'
    }
    if (extension === 'txt') {
      return 'text'
    }
    return null
  }

  const handleFileChange = (event: Event) => {
    resetMessages()
    const target = event.currentTarget as HTMLInputElement
    const file = target.files?.[0] ?? null

    if (!file) {
      setSelectedFile(null)
      setFormat(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null)
      setFormat(null)
      setErrorMessage('ファイルサイズは5MB以下にしてください。')
      return
    }

    const detectedFormat = detectFormat(file)
    if (!detectedFormat) {
      setSelectedFile(null)
      setFormat(null)
      setErrorMessage('アップロードできるのは .json または .txt のみです。')
      return
    }

    setSelectedFile(file)
    setFormat(detectedFormat)
  }

  const handleSubmit = async () => {
    resetMessages()

    if (!selectedFile() || !format()) {
      setErrorMessage('アップロードするファイルを選択してください。')
      return
    }

    const uploadFormat = format()
    setIsSubmitting(true)
    try {
      const fileText = await selectedFile()?.text()

      if (uploadFormat === 'json') {
        try {
          JSON.parse(fileText ?? '')
        } catch {
          setErrorMessage('JSONの形式が正しくありません。')
          return
        }
      }

      await postRegisterData({
        data: fileText ?? '',
        format: uploadFormat as RegisterDataFormat,
      })
      setSuccessMessage('スコアデータを送信しました。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'アップロードに失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  useDocumentTitle('スコア登録(一時)')

  return (
    <div class="mx-auto w-full max-w-3xl p-6">
      <div class="space-y-4">
        <div>
          <h1 class="text-2xl font-semibold">スコア情報アップロード</h1>
          <p class="mt-2 text-sm text-gray-600">
            .txt (base64+gzip) もしくは .json (デバッグ用) をアップロードできます。 JSONは送信時に{' '}
            <span class="font-semibold">?format=json</span>
            を付与します。
          </p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700" for="score-file">
              アップロードファイル
            </label>
            <input
              id="score-file"
              type="file"
              accept=".json,.txt"
              onChange={handleFileChange}
              class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-green-600 hover:file:bg-green-100"
            />
            <Show when={selectedFile()}>
              {(file) => (
                <div class="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                  <p>ファイル名: {file().name}</p>
                  <p>
                    形式:
                    <span class="ml-1 font-semibold">
                      {format() !== null ? formatLabelMap[format() as UploadFormat] : '未判定'}
                    </span>
                  </p>
                  <p>サイズ: {(file().size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </Show>
            <div class="text-xs text-gray-500">
              アップロード上限は5MBです。Cookie認証が必要なのでログイン済みで操作してください。
            </div>
          </div>
        </div>

        <Show when={errorMessage()}>
          <p class="text-sm text-red-600">{errorMessage()}</p>
        </Show>
        <Show when={successMessage()}>
          <p class="text-sm text-green-600">{successMessage()}</p>
        </Show>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSubmit}
          disabled={isSubmitting()}
        >
          {isSubmitting() ? '送信中...' : 'アップロードする'}
        </button>
      </div>
      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-2">ブックマークレットコード</h2>
        <div>
          <pre class="bg-gray-100 rounded-md p-4 overflow-x-auto text-sm">
            {`javascript:(function(){var e=document.createElement("script");e.src="https://reiwa.f5.si/bookmarklets/chunisupport_test.js?%22+Math.floor(Date.now()/1000);document.body.appendChild(e)})();`}
          </pre>
        </div>
        <div class="mt-2 flex items-center justify-end gap-2">
          <Show when={copied()}>
            <span class="text-green-600 text-xs">コピーしました！</span>
          </Show>
          <button
            type="button"
            class="bg-green-600 text-white p-3 rounded hover:bg-green-700"
            onClick={() => {
              const code =
                'javascript:(function(){var e=document.createElement("script");e.src="https://reiwa.f5.si/bookmarklets/chunisupport_test.js?%22+Math.floor(Date.now()/1000);document.body.appendChild(e)})();'
              if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(code).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
              } else {
                // フォールバック: テキストエリアを使ってコピー
                const textarea = document.createElement('textarea')
                textarea.value = code
                document.body.appendChild(textarea)
                textarea.select()
                try {
                  document.execCommand('copy')
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch (e) {
                  alert('コピーに失敗しました。手動でコピーしてください。')
                }
                document.body.removeChild(textarea)
              }
            }}
          >
            コピー
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterScoreTempPage
