import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * 仮想フレームとスクロール領域を使って履歴復元の順序を検証する。
 *
 * @param script - ナビゲーションと表示準備状態の検証コード。
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
import {
  rememberAppMainScrollNavigationTarget, saveAppMainScrollOffset,
} from './src/utils/appMainScrollRestoration.ts'
const nativeSetInterval = globalThis.setInterval
globalThis.setInterval = (...args) => nativeSetInterval(...args).unref()
globalThis.window = { history: { state: { _depth: 0 } } }
const calls = []
const scrollElement = { scrollTo: ({ top }) => calls.push(top) }
globalThis.document = {
  addEventListener() {},
  getElementById: () => scrollElement,
}
const frames = new Map()
let frameId = 0
globalThis.requestAnimationFrame = (callback) => {
  frames.set(++frameId, callback)
  return frameId
}
globalThis.cancelAnimationFrame = (id) => frames.delete(id)
const flush = async () => {
  await Promise.resolve()
  for (const [id, callback] of frames) {
    frames.delete(id)
    callback()
  }
}
const { createAppMainScrollRestoreEffect } =
  await import('./src/hooks/useAppMainScrollRestoration.ts')
${script}
`,
  ])
  assert.equal(stderr, '')
}

test('非同期の表示準備を待ち、同一マウントで別タブへ戻る場合も復元する', async () => {
  await runBrowserTest(`
saveAppMainScrollOffset('/standard', 2400)
saveAppMainScrollOffset('/course', 640)
rememberAppMainScrollNavigationTarget(-1)
const view = createRoot((dispose) => {
  const [path, setPath] = createSignal('/standard')
  const [ready, setReady] = createSignal(false)
  createAppMainScrollRestoreEffect(path, ready)
  return { dispose, setPath, setReady }
})
await flush()
assert.deepEqual(calls, [])
view.setReady(true)
await flush()
assert.deepEqual(calls, [2400, 2400])

view.setReady(false)
view.setPath('/course')
await flush()
assert.deepEqual(calls, [2400, 2400])
view.setReady(true)
await flush()
assert.deepEqual(calls, [2400, 2400, 640, 640])
view.setReady(false)
view.setReady(true)
await flush()
assert.equal(calls.length, 4)
view.dispose()
`)
})

test('新規リンク遷移では読込完了後も保存位置へ戻さない', async () => {
  await runBrowserTest(`
saveAppMainScrollOffset('/standard', 2400)
rememberAppMainScrollNavigationTarget('/standard')
const view = createRoot((dispose) => {
  const [ready, setReady] = createSignal(false)
  createAppMainScrollRestoreEffect(() => '/standard', ready)
  return { dispose, setReady }
})
view.setReady(true)
await flush()
assert.deepEqual(calls, [])
view.dispose()
`)
})

test('別ページへの遷移とアンマウントで古い復元を中止する', async () => {
  await runBrowserTest(`
saveAppMainScrollOffset('/standard', 2400)
rememberAppMainScrollNavigationTarget(-1)
const view = createRoot((dispose) => {
  const [path, setPath] = createSignal('/standard')
  createAppMainScrollRestoreEffect(path, () => true)
  return { dispose, setPath }
})
rememberAppMainScrollNavigationTarget('/detail')
view.setPath('/detail')
await flush()
assert.deepEqual(calls, [])

rememberAppMainScrollNavigationTarget(-1)
view.setPath('/standard')
await Promise.resolve()
assert.deepEqual(calls, [2400])
view.dispose()
await flush()
assert.deepEqual(calls, [2400])
`)
})
