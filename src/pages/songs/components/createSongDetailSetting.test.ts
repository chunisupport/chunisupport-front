import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidで非同期の楽曲設定を検証する。
 *
 * @param script - Signalと保存処理を操作する検証コード。
 * @returns 検証終了時に解決するPromise。
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
import { createSongDetailSetting } from './src/pages/songs/components/createSongDetailSetting.ts'
const settle = () => new Promise((resolve) => setImmediate(resolve))
const messages = { loadError: 'load failed', saveError: 'save failed' }
${script}
`,
  ])
  assert.equal(stderr, '')
}

test('未ログイン中は取得せず、保存完了まで状態を維持して連打を防ぐ', async () => {
  await runBrowserTest(`
let loads = 0
let saves = 0
let finishSave
const view = createRoot((dispose) => {
  const [username, setUsername] = createSignal(undefined)
  const setting = createSongDetailSetting({
    username, songId: () => 'song-a', ...messages,
    load: async () => { loads++; return false },
    save: async () => { saves++; await new Promise((resolve) => { finishSave = resolve }) },
  })
  return { dispose, setting, setUsername }
})
assert.equal(loads, 0)
assert.equal(view.setting.disabled(), true)
view.setUsername('alice')
await settle()
assert.equal(view.setting.value(), false)
assert.equal(view.setting.disabled(), false)
const saving = view.setting.save(true)
await view.setting.save(true)
assert.equal(view.setting.value(), false)
assert.equal(view.setting.busy(), true)
assert.equal(saves, 1)
finishSave()
await saving
assert.equal(view.setting.value(), true)
assert.equal(view.setting.busy(), false)
view.dispose()
`)
})

test('楽曲やユーザーを切り替えた後の古い保存結果を表示に反映しない', async () => {
  await runBrowserTest(`
let finishSave
const view = createRoot((dispose) => {
  const [songId, setSongId] = createSignal('song-a')
  const [username, setUsername] = createSignal('alice')
  const setting = createSongDetailSetting({
    username, songId, ...messages,
    load: async () => false,
    save: async () => new Promise((resolve) => { finishSave = resolve }),
  })
  return { dispose, setting, setSongId, setUsername }
})
await settle()
const saving = view.setting.save(true)
view.setSongId('song-b')
view.setUsername('bob')
await settle()
finishSave()
await saving
assert.equal(view.setting.value(), false)
assert.equal(view.setting.errorMessage(), undefined)
view.dispose()
`)
})

test('ULTIMA専用設定の保存失敗時は通常設定を維持し、再試行できる', async () => {
  await runBrowserTest(`
let fail = true
const view = createRoot((dispose) => ({
  dispose,
  setting: createSongDetailSetting({
    username: () => 'alice', songId: () => 'song-a', ...messages,
    load: async () => ({ normal: true, ultima: false }),
    save: async () => { if (fail) throw new Error('network') },
  }),
}))
await settle()
await view.setting.save({ normal: true, ultima: true })
assert.deepEqual(view.setting.value(), { normal: true, ultima: false })
assert.equal(view.setting.errorMessage(), messages.saveError)
assert.equal(view.setting.disabled(), false)
fail = false
await view.setting.save({ normal: true, ultima: true })
assert.deepEqual(view.setting.value(), { normal: true, ultima: true })
assert.equal(view.setting.errorMessage(), undefined)
view.dispose()
`)
})

test('取得失敗時は未解禁設定の保存を実行しない', async () => {
  await runBrowserTest(`
let saves = 0
const view = createRoot((dispose) => ({
  dispose,
  setting: createSongDetailSetting({
    username: () => 'alice', songId: () => 'song-a', ...messages,
    load: async () => { throw new Error('network') },
    save: async () => { saves++ },
  }),
}))
await settle()
assert.equal(view.setting.errorMessage(), messages.loadError)
assert.equal(view.setting.disabled(), true)
await view.setting.save(true)
assert.equal(saves, 0)
view.dispose()
`)
})
