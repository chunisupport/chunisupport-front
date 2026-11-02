import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidのEffectを実行し、計算機の入力同期を検証する。
 * @param script - 初回Effect後に実行する操作と検証。
 * @param initialBase - 初回の集計値。undefinedなら読み込み待ち。
 * @returns 検証完了時に解決するPromise。
 */
const runInputTest = async (
  script: string,
  initialBase: string = '{ current: 500, max: 1000 }'
): Promise<void> => {
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'
import { batch, createRoot, createSignal } from 'solid-js'
import { createOverPowerCalculatorInputs } from './src/hooks/createOverPowerCalculatorInputs.ts'
const view = createRoot(dispose => {
  const [username, setUsername] = createSignal('alice')
  const [base, setBase] = createSignal(${initialBase})
  const [selection, setSelection] = createSignal('locked')
  return {
    dispose, setUsername, setBase, setSelection,
    input: createOverPowerCalculatorInputs(username, base, selection),
  }
})
await Promise.resolve()
const input = view.input
${script}
view.dispose()
`,
  ])
  assert.equal(stderr, '')
}

test('初回インポート後の入力・加算・クイック目標を再取得で上書きしない', async () => {
  await runInputTest(`
// Given: 初回インポート後に満点・獲得値・目標を編集
assert.equal(input.maxValue(), '1000.000')
assert.equal(input.currentValue(), '500.000')
assert.equal(input.targetPercent(), '50.00000')
input.setMaxValue('1100.000')
input.setCurrentValue('550.000')
input.setTargetPercent('99.50000')
// When: 同じユーザー・同じ集計対象で再取得
view.setBase({ current: 510, max: 1020 })
// Then: 編集値を保持
assert.equal(input.maxValue(), '1100.000')
assert.equal(input.currentValue(), '550.000')
assert.equal(input.targetPercent(), '99.50000')
`)
})

test('未編集の満点と獲得値は再取得で更新し、目標は初回値を保持する', async () => {
  await runInputTest(`
// Given & When: 未編集で再取得
view.setBase({ current: 600, max: 1200 })
// Then
assert.equal(input.maxValue(), '1200.000')
assert.equal(input.currentValue(), '600.000')
assert.equal(input.targetPercent(), '50.00000')
`)
})

test('未解禁扱いの切り替えは編集分を保って増減を反映し、元に戻せる', async () => {
  await runInputTest(`
// Given
input.setMaxValue('1100.000')
input.setCurrentValue('550.000')
input.setTargetPercent('99.50000')
// When: 解禁扱いへ切り替え
batch(() => {
  view.setSelection('unlocked')
  view.setBase({ current: 600, max: 1200 })
})
// Then: 手入力の+100、加算の+50、目標を保持
assert.equal(input.maxValue(), '1300.000')
assert.equal(input.currentValue(), '650.000')
assert.equal(input.targetPercent(), '99.50000')
// When & Then: 元に戻す
batch(() => {
  view.setSelection('locked')
  view.setBase({ current: 500, max: 1000 })
})
assert.equal(input.maxValue(), '1100.000')
assert.equal(input.currentValue(), '550.000')
assert.equal(input.targetPercent(), '99.50000')
`)
})

test('再取得の一時的なデータ欠落後も入力と前回集計値を保持する', async () => {
  await runInputTest(`
// Given
input.setCurrentValue('550.000')
input.setTargetPercent('97.50000')
// When: 読み込み・エラー中の欠落から復旧
view.setBase(undefined)
assert.equal(input.currentValue(), '550.000')
view.setBase({ current: 510, max: 1000 })
// Then
assert.equal(input.currentValue(), '550.000')
assert.equal(input.targetPercent(), '97.50000')
// When & Then: 保存した未解禁設定の変更も反映
batch(() => {
  view.setSelection('another-locked-selection')
  view.setBase({ current: 520, max: 1100 })
})
assert.equal(input.currentValue(), '560.000')
assert.equal(input.maxValue(), '1100.000')
`)
})

test('ユーザー変更とログアウトで入力を初期化し、次の初回集計を反映する', async () => {
  await runInputTest(`
// Given
input.setMaxValue('1100.000')
input.setCurrentValue('550.000')
input.setTargetPercent('99.50000')
// When: 別ユーザーのデータ待ち
batch(() => { view.setUsername('bob'); view.setBase(undefined) })
// Then
assert.equal(input.maxValue(), '0.000')
assert.equal(input.currentValue(), '0.000')
assert.equal(input.targetPercent(), '0.00000')
view.setBase({ current: 200, max: 800 })
assert.equal(input.maxValue(), '800.000')
assert.equal(input.currentValue(), '200.000')
assert.equal(input.targetPercent(), '25.00000')
// When & Then: ログアウト→未ログイン時の手入力→同じユーザーへログイン
batch(() => { view.setUsername(undefined); view.setBase(undefined) })
assert.equal(input.maxValue(), '0.000')
input.setMaxValue('300.000')
input.setCurrentValue('150.000')
assert.equal(input.currentValue(), '150.000')
batch(() => { view.setUsername('bob'); view.setBase({ current: 200, max: 800 }) })
assert.equal(input.maxValue(), '800.000')
assert.equal(input.currentValue(), '200.000')
assert.equal(input.targetPercent(), '25.00000')
`)
})

test('初回データの到着前に編集した入力も保持する', async () => {
  await runInputTest(
    `
// Given
input.setCurrentValue('100.000')
input.setTargetPercent('95.00000')
// When
view.setBase({ current: 500, max: 1000 })
// Then: 未編集の満点だけ自動入力
assert.equal(input.maxValue(), '1000.000')
assert.equal(input.currentValue(), '100.000')
assert.equal(input.targetPercent(), '95.00000')
`,
    'undefined'
  )
})

test('対象を外して表示が0になっても負の調整分を保持し、戻した際に復元する', async () => {
  await runInputTest(`
// Given: 自動集計より小さい値へ手入力
input.setMaxValue('900.000')
input.setCurrentValue('400.000')
// When: 対象を全て除外
batch(() => {
  view.setSelection('empty')
  view.setBase({ current: 0, max: 0 })
})
// Then: 非負表示
assert.equal(input.maxValue(), '0.000')
assert.equal(input.currentValue(), '0.000')
// When: 0表示のまま再取得し、対象を戻す
view.setBase({ current: 0, max: 0 })
batch(() => {
  view.setSelection('locked')
  view.setBase({ current: 500, max: 1000 })
})
// Then: 編集した値へ戻る
assert.equal(input.maxValue(), '900.000')
assert.equal(input.currentValue(), '400.000')
`)
})
