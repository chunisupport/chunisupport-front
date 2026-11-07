import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidの実行条件で更新差分カードの表示状態Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `state`: 生成したPrimitive。
 * - `setChanges` / `setLevels`: 更新差分とソート用レベルを差し替えるSetter。
 * - `idxs(changes)`: 差分の楽曲・コースIDを並べた配列。
 * - `find(idx)`: 入力差分からIDで1件を取り出す関数。
 * 入力差分は次の順に並ぶ。
 * - `s1`: MASTER Lv.14 スコア更新
 * - `s2`: EXPERT Lv.12 ランプのみの更新
 * - `s3`: ULTIMA Lv.15 新規登録
 * - `w1`: WORLD'S END ランプのみの更新
 * - `c1`: コース スコア更新
 * - `c2`: コース ランプのみの更新
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runChangeListTest = async (script: string): Promise<void> => {
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
import { createRegisterScoreChangeListState } from './src/pages/register-score/createRegisterScoreChangeListState.ts'

const song = (idx, diff, before, after, recordType = 'standard') => ({
  record_type: recordType,
  change_type: before ? 'updated' : 'new',
  idx,
  diff,
  before: before && { score: before[0], clear_lamp: before[1], combo_lamp: null, full_chain: null },
  after: { score: after[0], clear_lamp: after[1], combo_lamp: null, full_chain: null },
})
const course = (idx, before, after) => ({
  record_type: 'course',
  change_type: 'updated',
  idx,
  course_class: '3',
  before: { score: before[0], is_clear: before[1], combo_lamp: null },
  after: { score: after[0], is_clear: after[1], combo_lamp: null },
})
const initialChanges = [
  song('s1', 'MASTER', [1_000_000, 'CLEAR'], [1_005_000, 'CLEAR']),
  song('s2', 'EXPERT', [1_000_000, 'clear'], [1_000_000, 'HARD']),
  song('s3', 'ULTIMA', null, [990_000, 'CLEAR']),
  song('w1', 'WE', [1_000_000, 'CLEAR'], [1_000_000, 'ABSOLUTE'], 'worldsend'),
  course('c1', [2_900_000, true], [2_950_000, true]),
  course('c2', [3_000_000, false], [3_000_000, true]),
]
const idxs = (changes) => changes.map((change) => change.idx)
const find = (idx) => initialChanges.find((change) => change.idx === idx)

const view = createRoot((dispose) => {
  const [changes, setChanges] = createSignal(initialChanges)
  const [levels, setLevels] = createSignal({ s1: 14, s2: 12, s3: 15 })
  const state = createRegisterScoreChangeListState({
    changes,
    resolveSongSortValues: (change) => ({ level: levels()[change.idx] ?? null, singleRating: null }),
  })
  return { dispose, state, setChanges, setLevels }
})
const { state, setChanges, setLevels } = view
${script}
view.dispose()
`,
  ])
  assert.equal(stderr, '')
}

test('初期状態ではAPIの順番で楽曲とコースを分け、画像からは何も除外しない', async () => {
  await runChangeListTest(`
// Given: 初期状態。
// When: 表示対象のカードを取得する。
// Then: 楽曲とコースをAPIの順番のまま分け、画像除外もない。
assert.deepEqual(idxs(state.songChanges()), ['s1', 's2', 's3', 'w1'])
assert.deepEqual(idxs(state.courseChanges()), ['c1', 'c2'])
assert.deepEqual(state.sortSettings(), { primaryKey: 'none', primaryDirection: 'asc' })
assert.equal(state.hideLampOnlyChanges(), false)
assert.equal(state.isExcludedFromImage(find('s1')), false)
assert.equal(state.songSectionExcludedFromImage(), false)
assert.equal(state.courseSectionExcludedFromImage(), false)
`)
})

test('ランプのみの更新を非表示にしたまま、残った楽曲カードをレベル順に並べ替える', async () => {
  await runChangeListTest(`
// Given: ランプのみの更新を非表示にする。
state.setHideLampOnlyChanges(true)
assert.deepEqual(idxs(state.songChanges()), ['s1', 's3'])
assert.deepEqual(idxs(state.courseChanges()), ['c1'])

// When: レベルの降順で並べ替える。
state.setPrimarySortKey('level')
state.setPrimarySortDirection('desc')

// Then: 非表示の差分は含まず、残った楽曲カードだけが並び替わる。
assert.deepEqual(idxs(state.songChanges()), ['s3', 's1'])

// When: ランプのみの更新を再表示する。
state.setHideLampOnlyChanges(false)

// Then: 再表示した差分もソート設定に従い、レベル未解決のWORLD'S ENDは末尾になる。
assert.deepEqual(idxs(state.songChanges()), ['s3', 's1', 's2', 'w1'])
assert.deepEqual(state.sortSettings(), { primaryKey: 'level', primaryDirection: 'desc' })
`)
})

test('画像除外はソートや表示切替をまたいで維持し、セクション除外は表示中のカードだけで判定する', async () => {
  await runChangeListTest(`
// Given: スコア更新したコースだけを画像から除外する。
state.setExcludedFromImage(find('c1'), true)
assert.equal(state.isExcludedFromImage(find('c1')), true)
assert.equal(state.courseSectionExcludedFromImage(), false)

// When: ランプのみの更新を非表示にして、表示中のコースを除外済みのc1だけにする。
state.setHideLampOnlyChanges(true)

// Then: 表示中のコースカードがすべて除外済みなので、コースセクションごと画像から除外する。
assert.deepEqual(idxs(state.courseChanges()), ['c1'])
assert.equal(state.courseSectionExcludedFromImage(), true)

// When: 楽曲カードを並べ替えてから、ランプのみの更新を再表示する。
state.setPrimarySortKey('level')
state.setHideLampOnlyChanges(false)

// Then: c1の除外状態は維持され、除外していないc2が表示されるためセクションは画像に残る。
assert.equal(state.isExcludedFromImage(find('c1')), true)
assert.equal(state.isExcludedFromImage(find('c2')), false)
assert.equal(state.courseSectionExcludedFromImage(), false)
assert.equal(state.songSectionExcludedFromImage(), false)
`)
})

test('楽曲カードをすべて除外するとセクションも除外し、1枚戻すと画像に含める', async () => {
  await runChangeListTest(`
// Given: ランプのみの更新を非表示にし、表示中の楽曲カードをすべて除外する。
state.setHideLampOnlyChanges(true)
for (const change of state.songChanges()) state.setExcludedFromImage(change, true)
assert.equal(state.songSectionExcludedFromImage(), true)

// When: 1枚だけ画像に含める。
state.setExcludedFromImage(find('s3'), false)

// Then: セクションは画像に残り、戻したカードだけが除外対象から外れる。
assert.equal(state.songSectionExcludedFromImage(), false)
assert.equal(state.isExcludedFromImage(find('s1')), true)
assert.equal(state.isExcludedFromImage(find('s3')), false)
`)
})

test('表示中の楽曲カードがない場合は空状態を残すため楽曲セクションを除外しない', async () => {
  await runChangeListTest(`
// Given: 楽曲差分がランプのみの更新だけの登録結果。
setChanges([find('s2'), find('w1')])
state.setExcludedFromImage(find('s2'), true)
state.setExcludedFromImage(find('w1'), true)
assert.equal(state.songSectionExcludedFromImage(), true)

// When: ランプのみの更新を非表示にする。
state.setHideLampOnlyChanges(true)

// Then: 楽曲カードがなくなり、空状態を表示するセクションは画像に残る。
assert.deepEqual(state.songChanges(), [])
assert.equal(state.songSectionExcludedFromImage(), false)
`)
})

test('ソート値の解決関数が読む値が変わると楽曲カードを並べ直す', async () => {
  await runChangeListTest(`
// Given: レベルの昇順で並べている。
state.setPrimarySortKey('level')
assert.deepEqual(idxs(state.songChanges()), ['s2', 's1', 's3', 'w1'])

// When: 楽曲マスタの読み込みなどでソート用レベルが変わる。
setLevels({ s1: 11, s2: 12, s3: 15 })

// Then: 新しいレベルで並べ直す。
assert.deepEqual(idxs(state.songChanges()), ['s1', 's2', 's3', 'w1'])
`)
})
