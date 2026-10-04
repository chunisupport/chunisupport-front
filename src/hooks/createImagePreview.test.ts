import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向け Solid の実行条件で画像プレビュー Primitive を検証する。
 * `setup(overrides)` で既定設定を上書きした Primitive を生成し、`flush()` で非同期処理を待てる。
 * `pending` に積まれた画像生成を `resolveCapture` / `rejectCapture` で完了させる。
 * 解放された Object URL は `revoked`、共有の呼び出しは `shared` に記録される。
 *
 * @param script - Primitive を操作する検証コード。
 * @returns 検証終了時に解決する Promise。
 */
const runBrowserTest = async (script: string): Promise<void> => {
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'
import { createRoot, createSignal } from 'solid-js'
import { createImagePreview } from './src/hooks/createImagePreview.ts'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const revoked = []
const originalRevoke = URL.revokeObjectURL
URL.revokeObjectURL = (url) => {
  revoked.push(url)
  originalRevoke(url)
}
const shared = []
let shareError
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    canShare: () => true,
    share: async (data) => {
      shared.push(data)
      if (shareError) throw shareError
    },
  },
})
const setShareError = (error) => {
  shareError = error
}

const pending = []
const resolveCapture = async (index, value = 'image') => {
  pending[index].resolve(value)
  await flush()
}
const rejectCapture = async (index) => {
  pending[index].reject(new Error('capture failed'))
  await flush()
}

const setup = (overrides = {}) =>
  createRoot((dispose) => ({
    dispose,
    preview: createImagePreview({
      capture: () =>
        new Promise((resolve, reject) => {
          pending.push({ resolve, reject })
        }),
      toFiles: (value) => [new File([value], 'image.png', { type: 'image/png' })],
      captureErrorMessage: 'capture error',
      shareErrorMessage: 'share error',
      shareTitle: 'title',
      ...overrides,
    }),
  }))

${script}
`,
  ])
  assert.equal(stderr, '')
}

test('ダイアログを開くと自動で画像を生成し、閉じるとObject URLを解放すること', async () => {
  await runBrowserTest(`
// Given
const { preview, dispose } = setup()

// When: 開いて生成を完了する
preview.handleOpenChange(true)
await flush()
assert.equal(preview.isCapturing(), true)
await resolveCapture(0)

// Then
assert.equal(pending.length, 1)
assert.equal(preview.isCapturing(), false)
assert.equal(preview.previews().length, 1)
const url = preview.previews()[0].url

// When: 閉じる
preview.handleOpenChange(false)

// Then
assert.deepEqual(preview.previews(), [])
assert.deepEqual(revoked, [url])
dispose()
`)
})

test('生成中に破棄した場合は古い生成結果を反映せず再生成すること', async () => {
  await runBrowserTest(`
// Given: 1回目の生成中
const { preview, dispose } = setup()
preview.handleOpenChange(true)
await flush()

// When: 破棄して再生成させ、古い生成を後から完了する
preview.reset()
await flush()
await resolveCapture(0, 'old')

// Then: 2回目の生成が進行中で、古い結果は反映されない
assert.equal(pending.length, 2)
assert.equal(preview.isCapturing(), true)
assert.deepEqual(preview.previews(), [])

await resolveCapture(1, 'new')
assert.equal(preview.previews().length, 1)
assert.equal(await preview.previews()[0].file.text(), 'new')
dispose()
`)
})

test('生成に失敗した場合は自動で再生成せず、再試行で生成し直すこと', async () => {
  await runBrowserTest(`
// Given
const { preview, dispose } = setup()
preview.handleOpenChange(true)
await flush()

// When: 生成に失敗する
await rejectCapture(0)

// Then: エラーを表示し、自動では再生成しない
assert.equal(preview.captureError(), 'capture error')
assert.equal(pending.length, 1)

// When: 再試行する
preview.retryCapture()
await flush()

// Then
assert.equal(pending.length, 2)
assert.equal(preview.captureError(), undefined)
dispose()
`)
})

test('生成条件が揃うまで画像生成を開始しないこと', async () => {
  await runBrowserTest(`
// Given: 生成条件が揃っていない
const [ready, setReady] = createSignal(false)
const { preview, dispose } = setup({ canCapture: ready })
preview.handleOpenChange(true)
await flush()
assert.equal(pending.length, 0)

// When: 条件が揃う
setReady(true)
await flush()

// Then
assert.equal(pending.length, 1)
dispose()
`)
})

test('共有シートを閉じた場合はエラーにせず、それ以外の失敗はエラーにすること', async () => {
  await runBrowserTest(`
// Given
const { preview, dispose } = setup()
preview.handleOpenChange(true)
await flush()
await resolveCapture(0)
const files = [preview.previews()[0].file]

// When: ユーザーが共有シートを閉じる
setShareError(new DOMException('aborted', 'AbortError'))
await preview.share(files)

// Then
assert.equal(shared.length, 1)
assert.equal(shared[0].title, 'title')
assert.equal(preview.shareError(), undefined)

// When: 共有に失敗する
setShareError(new Error('failed'))
await preview.share(files)

// Then
assert.equal(preview.shareError(), 'share error')
assert.equal(preview.isSharing(), false)
dispose()
`)
})

test('生成中に閉じられるかは設定に従うこと', async () => {
  await runBrowserTest(`
// Given: 生成中も閉じられない設定で生成中
const { preview, dispose } = setup({ lockCloseWhileCapturing: true })
preview.handleOpenChange(true)
await flush()

// When
preview.handleOpenChange(false)

// Then: 閉じられない
assert.equal(preview.isCloseLocked(), true)
assert.equal(preview.open(), true)
dispose()

// Given: 既定設定で生成中
const other = setup()
other.preview.handleOpenChange(true)
await flush()

// When
other.preview.handleOpenChange(false)

// Then: 閉じられ、生成中状態も解除される
assert.equal(other.preview.open(), false)
assert.equal(other.preview.isCapturing(), false)
other.dispose()
`)
})
