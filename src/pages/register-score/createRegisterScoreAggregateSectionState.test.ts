import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidの実行条件で集計セクションの表示状態Primitiveを検証する。
 *
 * 検証コードでは、ALL・MASTER・WEの3行を持つ `state` と、行のキーを並べる `keys(rows)` を利用できる。
 * 初期表示状態はALLとMASTERだけが有効である。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runAggregateSectionTest = async (script: string): Promise<void> => {
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createRegisterScoreAggregateSectionState } from './src/pages/register-score/createRegisterScoreAggregateSectionState.ts'

const rows = [{ key: 'ALL' }, { key: 'MASTER' }, { key: 'WE' }]
const keys = (items) => items.map((row) => row.key)
const view = createRoot((dispose) => ({
  dispose,
  state: createRegisterScoreAggregateSectionState({
    rows: () => rows,
    initialRowVisibility: {
      ALL: true,
      BASIC: false,
      ADVANCED: false,
      EXPERT: false,
      MASTER: true,
      ULTIMA: false,
      WE: false,
    },
  }),
}))
const { state } = view
${script}
view.dispose()
`,
  ])
  assert.equal(stderr, '')
}

test('初期表示状態で有効な集計行だけを表示する', async () => {
  await runAggregateSectionTest(`
// Given: 初期状態。
// When: 表示対象の集計行を取得する。
// Then: 初期表示状態で有効な行だけを入力順に表示する。
assert.equal(state.enabled(), true)
assert.deepEqual(keys(state.visibleRows()), ['ALL', 'MASTER'])
assert.equal(state.displayed(), true)
`)
})

test('集計行の表示を切り替えても入力順を保つ', async () => {
  await runAggregateSectionTest(`
// Given: 初期状態。
// When: WEを表示し、ALLを非表示にする。
state.setRowVisible('WE', true)
state.setRowVisible('ALL', false)

// Then: 行の表示状態が反映され、表示順は入力順のままになる。
assert.equal(state.rowVisibility().WE, true)
assert.equal(state.rowVisibility().ALL, false)
assert.deepEqual(keys(state.visibleRows()), ['MASTER', 'WE'])
`)
})

test('セクションを無効にしても行の表示設定は保持し、再度有効にすると復元する', async () => {
  await runAggregateSectionTest(`
// Given: WEを表示に追加する。
state.setRowVisible('WE', true)

// When: セクションを無効にする。
state.setEnabled(false)

// Then: レポートには表示しないが、行ごとの設定は保持する。
assert.equal(state.displayed(), false)
assert.deepEqual(keys(state.visibleRows()), ['ALL', 'MASTER', 'WE'])

// When: セクションを再度有効にする。
state.setEnabled(true)

// Then: 無効にする前の行の表示設定で表示する。
assert.equal(state.displayed(), true)
assert.deepEqual(keys(state.visibleRows()), ['ALL', 'MASTER', 'WE'])
`)
})

test('セクションが有効でも表示する集計行がなければレポートに表示しない', async () => {
  await runAggregateSectionTest(`
// Given: セクションは有効。
// When: すべての行を非表示にする。
state.setRowVisible('ALL', false)
state.setRowVisible('MASTER', false)

// Then: 見出しだけの空セクションは表示しない。
assert.equal(state.enabled(), true)
assert.deepEqual(state.visibleRows(), [])
assert.equal(state.displayed(), false)
`)
})
