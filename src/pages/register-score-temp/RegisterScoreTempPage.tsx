import { createSignal, Show } from 'solid-js'

import { postRegisterData } from '../../api/register-data'
import { AppButton } from '../../components/common/AppButton'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'

type RegisterDataFormat = 'json' | 'text'

const MAX_FILE_SIZE = 5 * 1024 * 1024

type UploadFormat = 'json' | 'text'

const formatLabelMap: Record<UploadFormat, string> = {
  json: 'JSON (debug)',
  text: 'TXT (base64+gzip)',
}

/**
 * スコア登録用データを一時アップロードする検証ページを表示する。
 *
 * @returns スコア登録データのアップロード画面。
 */
const RegisterScoreTempPage = () => {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null)
  const [format, setFormat] = createSignal<UploadFormat | null>(null)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [copied, setCopied] = createSignal(false)

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
      showErrorToast('ファイルサイズは5MB以下にしてください。')
      return
    }

    const detectedFormat = detectFormat(file)
    if (!detectedFormat) {
      setSelectedFile(null)
      setFormat(null)
      showErrorToast('アップロードできるのは .json または .txt のみです。')
      return
    }

    setSelectedFile(file)
    setFormat(detectedFormat)
  }

  /**
   * 選択されたスコアデータファイルを検証して一時アップロードする。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleSubmit = async () => {
    if (!selectedFile() || !format()) {
      showErrorToast('アップロードするファイルを選択してください。')
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
          showErrorToast('JSONの形式が正しくありません。')
          return
        }
      }

      await postRegisterData({
        data: fileText ?? '',
        format: uploadFormat as RegisterDataFormat,
      })
      showSuccessToast('スコアデータを送信しました。')
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, 'アップロードに失敗しました。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  useDocumentTitle('スタッフ向けスコア登録検証')

  return (
    <div class="mx-auto w-full max-w-3xl p-6">
      <div class="space-y-4">
        <div>
          <h1 class="text-2xl font-semibold">スタッフ向けスコア登録検証</h1>
          <p class="mt-2 text-sm text-text-muted">
            スタッフ向けの一時検証画面です。.txt (base64+gzip) もしくは .json (デバッグ用)
            をアップロードできます。JSONは送信時に <span class="font-semibold">?format=json</span>
            を付与します。
          </p>
        </div>

        <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-text-muted" for="score-file">
              アップロードファイル
            </label>
            <input
              id="score-file"
              type="file"
              accept=".json,.txt"
              onChange={handleFileChange}
              class="block w-full text-sm text-text-muted file:mr-4 file:rounded-md file:border-0 file:bg-action-primary-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-action-primary hover:file:bg-action-primary-muted"
            />
            <Show when={selectedFile()}>
              {(file) => (
                <div class="rounded-md bg-surface-muted p-3 text-sm text-text-muted">
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
            <div class="text-xs text-text-subtle">
              アップロード上限は5MBです。Cookie認証が必要なのでログイン済みで操作してください。
            </div>
          </div>
        </div>

        <AppButton
          variant="primary"
          class="rounded-md shadow-sm"
          onClick={handleSubmit}
          disabled={isSubmitting()}
        >
          {isSubmitting() ? '送信中...' : 'アップロードする'}
        </AppButton>
      </div>

      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-2">ブックマークレットコード</h2>
        <div>
          <pre class="bg-surface-hover rounded-md p-4 overflow-x-auto text-sm">
            {`javascript:(function(){var e=document.createElement("script");e.src="https://reiwa.f5.si/bookmarklets/chunisupport_test.js?%22+Math.floor(Date.now()/1000);document.body.appendChild(e)})();`}
          </pre>
        </div>
        <div class="mt-2 flex items-center justify-end gap-2">
          <Show when={copied()}>
            <span class="text-action-primary text-xs">コピーしました！</span>
          </Show>
          <AppButton
            variant="primary"
            class="p-3"
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
          </AppButton>
        </div>
      </div>
    </div>
  )
}

export default RegisterScoreTempPage
