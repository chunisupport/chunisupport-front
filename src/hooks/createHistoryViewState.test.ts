import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向け Solid の実行条件で表示状態の復元を検証する。
 *
 * @param script - Signal と履歴遷移を操作する検証コード。
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
import { createHistoryViewState } from './src/hooks/createHistoryViewState.ts'
import { rememberAppMainScrollNavigationTarget } from './src/utils/appMainScrollRestoration.ts'
${script}
`,
  ])
  assert.equal(stderr, '')
}

test('履歴で戻る場合はユーザー別のソートと統計開閉を復元する', async () => {
  await runBrowserTest(`
const useViewState = createHistoryViewState()
rememberAppMainScrollNavigationTarget('/users/alice/record_normal')
const first = createRoot((dispose) => ({
  dispose,
  state: useViewState(() => 'alice', () => ({ sort: 'rating', statsOpen: false })),
}))
first.state[1]({ sort: 'score', statsOpen: true })
first.dispose()

rememberAppMainScrollNavigationTarget(-1)
const restored = createRoot((dispose) => ({
  dispose,
  alice: useViewState(() => 'alice', () => ({ sort: 'rating', statsOpen: false })),
  bob: useViewState(() => 'bob', () => ({ sort: 'rating', statsOpen: false })),
}))
assert.deepEqual(restored.alice[0](), { sort: 'score', statsOpen: true })
assert.deepEqual(restored.bob[0](), { sort: 'rating', statsOpen: false })
restored.dispose()
`)
})

test('リンクで新規に開いた場合は保存済み表示状態を復元しない', async () => {
  await runBrowserTest(`
const useViewState = createHistoryViewState()
const first = createRoot((dispose) => ({
  dispose, state: useViewState(() => 'alice', () => false),
}))
first.state[1](true)
first.dispose()

rememberAppMainScrollNavigationTarget('/users/alice/record_normal')
const next = createRoot((dispose) => ({
  dispose, state: useViewState(() => 'alice', () => false),
}))
assert.equal(next.state[0](), false)
next.dispose()
`)
})

test('ユーザー切替と更新関数に対応し、別タブのキャッシュと混ざらない', async () => {
  await runBrowserTest(`
const useStandardState = createHistoryViewState()
const useWorldsendState = createHistoryViewState()
const view = createRoot((dispose) => {
  const [username, setUsername] = createSignal('alice')
  return {
    dispose, setUsername,
    standard: useStandardState(username, () => 0),
    worldsend: useWorldsendState(username, () => 0),
  }
})
view.standard[1]((current) => current + 2)
view.worldsend[1](9)
view.setUsername('bob')
view.standard[1](5)
assert.equal(view.worldsend[0](), 0)
rememberAppMainScrollNavigationTarget(1)
view.setUsername('alice')
assert.equal(view.standard[0](), 2)
assert.equal(view.worldsend[0](), 9)
view.dispose()
`)
})
