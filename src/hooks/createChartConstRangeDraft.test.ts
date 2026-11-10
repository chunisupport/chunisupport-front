import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidのSignalで範囲入力の操作を検証する。
 * @param script - 範囲選択と入力Primitiveに対する操作・アサーション。
 * @returns 検証完了時に解決するPromise。
 */
const runRangeTest = async (script: string): Promise<void> => {
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
import { createChartConstRangeDraft } from './src/hooks/createChartConstRangeDraft.ts'
import { createFullChartConstRange, normalizeChartConstRange } from './src/utils/chartLevel.ts'
const view = createRoot(dispose => {
  const [selection, setSelection] = createSignal({ constFilterMode: 'level', constRange: createFullChartConstRange() })
  const draft = createChartConstRangeDraft({ get: selection, set: setSelection })
  return { dispose, selection, setSelection, draft }
})
const { draft, selection, setSelection } = view
const field = draft.fieldProps
${script}
view.dispose()
`,
  ])
  assert.equal(stderr, '')
}

test('レベルの両端を選ぶと定数範囲と数値表示に反映される', async () => {
  await runRangeTest(`
// Given: レベル指定の全範囲。
assert.equal(field.constFilterMode, 'level')
// When: プラス付きレベルを含む範囲を選ぶ。
field.onConstLevelChange('min', '13+')
field.onConstLevelChange('max', '14')
// Then: 両端を含む定数範囲へ変換し、数値表示も同期する。
assert.deepEqual(selection().constRange, { min: 13.5, max: 14.4 })
assert.equal(field.minValue, '13.5')
assert.equal(field.maxValue, '14.4')
field.onConstFilterModeChange('number')
assert.equal(field.constFilterMode, 'number')
assert.equal(field.minValue, '13.5')
assert.equal(field.maxValue, '14.4')
`)
})

test('数値指定からレベル指定へ切り替えると入力表示もレベル境界へ同期する', async () => {
  await runRangeTest(`
// Given: レベル境界に一致しない数値範囲。
field.onConstFilterModeChange('number')
field.onMinInput('13.7')
field.onMinCommit('13.7')
field.onMaxInput('14.2')
field.onMaxCommit('14.2')
// When: 明示的にレベル指定へ切り替える。
field.onConstFilterModeChange('level')
// Then: 範囲・レベル・文字列のいずれも同じ端点を表す。
assert.deepEqual(selection().constRange, { min: 13.5, max: 14.4 })
assert.equal(field.constLevelMin, '13+')
assert.equal(field.constLevelMax, '14')
assert.equal(field.minValue, '13.5')
assert.equal(field.maxValue, '14.4')
`)
})

test('空欄を確定すると全範囲の端点になり低レベルの上限は小数9になる', async () => {
  await runRangeTest(`
// Given: 数値指定で範囲を変更する。
field.onConstFilterModeChange('number')
field.onMinCommit('13')
field.onMaxCommit('14')
// When: 両端を空欄で確定する。
field.onMinCommit('')
field.onMaxCommit('')
// Then: 全範囲へ戻る。
assert.deepEqual(selection().constRange, createFullChartConstRange())
field.onConstFilterModeChange('level')
field.onConstLevelChange('min', '5')
field.onConstLevelChange('max', '6')
assert.deepEqual(selection().constRange, { min: 5, max: 6.9 })
`)
})

test('末尾が小数点の入力を確定すると整数部分を端点にする', async () => {
  await runRangeTest(`
// Given: 数値指定で範囲を変更する。
field.onConstFilterModeChange('number')
field.onMinCommit('14.5')
field.onMaxCommit('15.4')
// When: 小数部分を消して末尾が小数点の状態で確定する。
field.onMinCommit('14.')
field.onMaxCommit('15.')
// Then: 全範囲の端点へ戻さず、入力した整数部分を端点にする。
assert.deepEqual(selection().constRange, { min: 14, max: 15 })
assert.equal(field.minValue, '14')
assert.equal(field.maxValue, '15')
`)
})

test('外部の適用値や初期値を同期しても数値範囲を丸めない', async () => {
  await runRangeTest(`
// Given: 数値指定の適用済み範囲。
const applied = { constFilterMode: 'number', constRange: { min: 13.7, max: 14.2 } }
setSelection(applied)
draft.sync(applied.constRange)
// When: 編集後にキャンセルし適用済み範囲を再読込する。
field.onMinCommit('12')
setSelection(applied)
draft.sync(applied.constRange)
// Then: モード・端点は元のまま復元される。
assert.equal(field.constFilterMode, 'number')
assert.equal(field.minValue, '13.7')
assert.equal(field.maxValue, '14.2')
assert.deepEqual(selection().constRange, { min: 13.7, max: 14.2 })
// When: 初期値へ戻す。
const full = createFullChartConstRange()
setSelection({ constFilterMode: 'level', constRange: full })
draft.sync(full)
// Then: モードと両端の表示が初期化される。
assert.equal(field.constFilterMode, 'level')
assert.equal(field.constLevelMin, '1')
assert.equal(field.constLevelMax, '16')
`)
})

test('逆順のレベル範囲を正規化して適用し再読込してもレベル全体を維持する', async () => {
  await runRangeTest(`
// Given: 開始14+、終了13を選ぶ。
field.onConstLevelChange('min', '14+')
field.onConstLevelChange('max', '13')
// When: ダイアログと同じ処理で適用値を作り再読込する。
const range = normalizeChartConstRange(selection().constRange, selection().constFilterMode)
setSelection({ constFilterMode: selection().constFilterMode, constRange: range })
draft.sync(range)
// Then: 表示の開始13・終了14+と実際の範囲が一致する。
assert.equal(field.constLevelMin, '13')
assert.equal(field.constLevelMax, '14+')
assert.equal(field.minValue, '13')
assert.equal(field.maxValue, '14.9')
assert.deepEqual(selection().constRange, { min: 13, max: 14.9 })
`)
})

test('複数の範囲入力は互いの範囲・モードを変更しない', async () => {
  await runRangeTest(`
// Given: 集計対象とは別の表示範囲入力。
const [axisSelection, setAxisSelection] = createSignal({ constFilterMode: 'level', constRange: { min: 10, max: 16 } })
const axisDraft = createChartConstRangeDraft({ get: axisSelection, set: setAxisSelection })
// When: 集計対象だけを数値指定に変え、表示範囲だけをレベル指定で絞る。
field.onConstFilterModeChange('number')
field.onMinCommit('13.7')
axisDraft.fieldProps.onConstLevelChange('max', '14+')
// Then: それぞれ独立した範囲とモードを維持する。
assert.equal(selection().constFilterMode, 'number')
assert.equal(selection().constRange.min, 13.7)
assert.equal(axisSelection().constFilterMode, 'level')
assert.deepEqual(axisSelection().constRange, { min: 10, max: 14.9 })
`)
})
