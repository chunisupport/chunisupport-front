import { createSignal, Show } from 'solid-js'

import { postPlayerDataCommit, postRegisterData } from '../../api/register-data'
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

  const [uploadToken, setUploadToken] = createSignal('')
  const [commitErrorMessage, setCommitErrorMessage] = createSignal('')
  const [commitSuccessMessage, setCommitSuccessMessage] = createSignal('')
  const [isCommitting, setIsCommitting] = createSignal(false)

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

  const handleCommit = async () => {
    setCommitErrorMessage('')
    setCommitSuccessMessage('')

    const token = uploadToken().trim()
    if (!token) {
      setCommitErrorMessage('uploadToken を入力してください。')
      return
    }

    setIsCommitting(true)
    try {
      await postPlayerDataCommit(token)
      setCommitSuccessMessage('スコアデータを確定保存しました。')
      setUploadToken('')
    } catch (error) {
      setCommitErrorMessage(error instanceof Error ? error.message : '確定保存に失敗しました。')
    } finally {
      setIsCommitting(false)
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
              class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-600 hover:file:bg-primary-100"
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
          <p class="text-sm text-primary-600">{successMessage()}</p>
        </Show>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSubmit}
          disabled={isSubmitting()}
        >
          {isSubmitting() ? '送信中...' : 'アップロードする'}
        </button>
      </div>
      <div class="mt-8">
        <h2 class="text-xl font-semibold mb-4">確定保存 (commit)</h2>
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <p class="text-sm text-gray-600">
            ブックマークレットが発行した <span class="font-semibold">uploadToken</span>{' '}
            を入力して確定保存します。Cookie認証が必要なのでログイン済みで操作してください。
          </p>
          <label class="block text-sm font-medium text-gray-700" for="upload-token">
            uploadToken
          </label>
          <input
            id="upload-token"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={uploadToken()}
            onInput={(e) => setUploadToken((e.currentTarget as HTMLInputElement).value)}
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Show when={commitErrorMessage()}>
            <p class="text-sm text-red-600">{commitErrorMessage()}</p>
          </Show>
          <Show when={commitSuccessMessage()}>
            <p class="text-sm text-primary-600">{commitSuccessMessage()}</p>
          </Show>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCommit}
            disabled={isCommitting()}
          >
            {isCommitting() ? '送信中...' : '確定保存する'}
          </button>
        </div>
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
            <span class="text-primary-600 text-xs">コピーしました！</span>
          </Show>
          <button
            type="button"
            class="bg-primary-600 text-white p-3 rounded hover:bg-primary-700"
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
                } catch (_e) {
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
