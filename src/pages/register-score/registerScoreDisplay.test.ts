import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  PlayerDataCourseRecordChange,
  PlayerDataRecordState,
  PlayerDataSongRecordChange,
} from '../../types/api'
import { REGISTER_SCORE_INCREASE_TEXT_CLASS } from './constants.ts'
import {
  courseClassBadgeClass,
  formatCourseClass,
  formatRegisterScoreChangeDelta,
  formatRegisterScoreImportedAt,
  formatRegisterScoreNullableRating,
  formatRegisterScoreStatisticDelta,
  formatWorldsendChartLevel,
  getRegisterScoreDifficultyBadgeClass,
  getRegisterScoreShortDifficultyLabel,
  getRegisterScoreStatisticColumnDividerClass,
  getRegisterScoreStatisticDifficultyTextClass,
  getRegisterScoreTotalHighScoreDeltaClass,
  REGISTER_SCORE_NO_DATA_TEXT,
  toRegisterScoreCourseLampRecord,
  toRegisterScoreLampRecord,
} from './registerScoreDisplay.ts'

/**
 * テスト用の楽曲レコード状態を生成する。
 *
 * @param overrides - 既定値から変更する項目。
 * @returns ランプなしのテスト用レコード状態。
 */
const createRecordState = (
  overrides: Partial<PlayerDataRecordState> = {}
): PlayerDataRecordState => ({
  score: 1_000_000,
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  ...overrides,
})

/**
 * テスト用の楽曲差分を生成する。
 *
 * @param overrides - 既定値から変更する項目。
 * @returns MASTER譜面の更新差分。
 */
const createSongChange = (
  overrides: Partial<PlayerDataSongRecordChange> = {}
): PlayerDataSongRecordChange => ({
  record_type: 'standard',
  change_type: 'updated',
  idx: 'song-1',
  diff: 'MASTER',
  before: createRecordState(),
  after: createRecordState(),
  ...overrides,
})

test('コースクラスをレポート用の短縮表記へ変換すること', () => {
  // Given: APIが返す全コースクラス。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'extra']

  // When: レポート表示用に変換する。
  const result = courseClasses.map(formatCourseClass)

  // Then: ローマ数字・無限大・EXで表示される。
  assert.deepEqual(result, ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', '∞', 'EX'])
})

test('コースクラスの英字値は大文字小文字を区別せず変換すること', () => {
  // Given: 大文字を含むAPI値。
  const courseClass = 'INF'

  // When: レポート表示用に変換する。
  const result = formatCourseClass(courseClass)

  // Then: 無限大の表記になる。
  assert.equal(result, '∞')
})

test('未対応のコースクラスは元の値で表示すること', () => {
  // Given: 未知のコースクラス。
  const courseClass = 'special'

  // When: レポート表示用に変換する。
  const result = formatCourseClass(courseClass)

  // Then: 情報を失わず元の値を表示する。
  assert.equal(result, 'special')
})

test('WORLD’S ENDの星数レベルを星付きで表示すること', () => {
  // Given: 最小・最大の星数レベル。
  const levelStars = [1, 5]

  // When: レポート表示用に変換する。
  const result = levelStars.map(formatWorldsendChartLevel)

  // Then: 星を付けたレベルで表示される。
  assert.deepEqual(result, ['★1', '★5'])
})

test('コースクラス別のバッジクラスが正しく返ること', () => {
  // Given: 全コースクラスと期待される背景クラス。
  const expectations: Readonly<Record<string, string>> = {
    '1': 'bg-course-class-1-bg',
    '2': 'bg-course-class-2-bg',
    '3': 'bg-course-class-3-bg',
    '4': 'bg-course-class-4-bg',
    '5': 'bg-course-class-5-bg',
  }

  for (const [courseClass, expectedBg] of Object.entries(expectations)) {
    // When: バッジクラスを取得する。
    const result = courseClassBadgeClass(courseClass)

    // Then: 背景クラスと黄色文字クラスが含まれる。
    assert.ok(result.includes(expectedBg), `${courseClass}: ${expectedBg} を含むはず`)
    assert.ok(result.includes('text-course-class-text'), `${courseClass}: 黄色文字クラスを含むはず`)
  }
})

test("コースクラス EX はWORLD'S ENDと同じ虹グラデーション背景になること", () => {
  // Given: extraクラス。
  const courseClass = 'extra'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: 虹グラデーションと黄色文字クラスが含まれる。
  assert.ok(result.includes('bg-[image:var(--cs-color-worldsend-label-bg)]'))
  assert.ok(result.includes('text-course-class-text'))
})

test('コースクラス ∞ はAJCと同じ薄い虹グラデーション背景になること', () => {
  // Given: infクラス。
  const courseClass = 'inf'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: 薄い虹グラデーションと黄色文字クラスが含まれる。
  assert.ok(result.includes('bg-[image:var(--cs-color-course-class-inf-bg)]'))
  assert.ok(result.includes('text-course-class-text'))
})

test('コースクラスバッジは未対応値を含むすべてのクラスで共通の文字影を持つこと', () => {
  // Given: 全コースクラスと未知のコースクラス。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'extra', 'special']

  // When: バッジクラスを取得する。
  const result = courseClasses.map(courseClassBadgeClass)

  // Then: 更新差分カードはこの文字影だけに頼るため、すべてのバッジに含まれる。
  result.forEach((className, index) => {
    assert.ok(className.includes('text-shadow-badge'), `${courseClasses[index]}: 文字影を含むはず`)
  })
})

test('未対応のコースクラスはsuccess色バッジを返すこと', () => {
  // Given: 未知のコースクラス。
  const courseClass = 'special'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: デフォルトのsuccess色クラスが返る。
  assert.ok(result.includes('bg-success-bg'))
  assert.ok(result.includes('text-success'))
})

test('レーティングがない場合はプレースホルダーを表示すること', () => {
  // Given: レーティング未取得。
  const rating = null

  // When: 表示用に変換する。
  const result = formatRegisterScoreNullableRating(rating)

  // Then: プレースホルダーになる。
  assert.equal(result, REGISTER_SCORE_NO_DATA_TEXT)
})

test('集計値の差分は正数だけにプラス記号を付けること', () => {
  // Given: 正・0・負の差分。
  const deltas = [1_234, 0, -5]

  // When: 符号付き表示へ変換する。
  const result = deltas.map(formatRegisterScoreStatisticDelta)

  // Then: 正数だけにプラス記号が付き、3桁区切りになる。
  assert.deepEqual(result, ['+1,234', '0', '-5'])
})

test('TOTAL HIGH SCOREの差分は正数だけ他の差分と同じ増加色にすること', () => {
  // Given / When
  const positive = getRegisterScoreTotalHighScoreDeltaClass(1)
  const zero = getRegisterScoreTotalHighScoreDeltaClass(0)

  // Then
  assert.equal(positive, REGISTER_SCORE_INCREASE_TEXT_CLASS)
  assert.equal(zero, 'text-text')
})

test('スコアが上昇した更新差分だけ増分を表示すること', () => {
  // Given: スコア上昇、ランプのみの更新、新規登録。
  const increased = createSongChange({
    before: createRecordState({ score: 1_000_000 }),
    after: createRecordState({ score: 1_001_500 }),
  })
  const lampOnly = createSongChange({
    before: createRecordState({ clear_lamp: 'CLEAR' }),
    after: createRecordState({ clear_lamp: 'HARD' }),
  })
  const created = createSongChange({ change_type: 'new', before: null })

  // When
  const result = [increased, lampOnly, created].map(formatRegisterScoreChangeDelta)

  // Then: スコア上昇だけが符号付きの増分になる。
  assert.deepEqual(result, ['+1,500', '', ''])
})

test('コース差分でもスコア上昇分を表示すること', () => {
  // Given: スコアが上昇したコース差分。
  const change: PlayerDataCourseRecordChange = {
    record_type: 'course',
    change_type: 'updated',
    idx: 'course-1',
    course_class: '3',
    before: { score: 2_900_000, is_clear: true, combo_lamp: null },
    after: { score: 2_950_000, is_clear: true, combo_lamp: null },
  }

  // When
  const result = formatRegisterScoreChangeDelta(change)

  // Then
  assert.equal(result, '+50,000')
})

test('楽曲差分の難易度を短縮表記とバッジ色へ変換すること', () => {
  // Given: 通常譜面とWORLD'S END譜面。
  const standard = createSongChange({ diff: 'ULTIMA' })
  const worldsend = createSongChange({ record_type: 'worldsend', diff: 'WE' })

  // When
  const labels = [standard, worldsend].map(getRegisterScoreShortDifficultyLabel)
  const badgeClasses = [standard, worldsend].map(getRegisterScoreDifficultyBadgeClass)

  // Then: 通常譜面は難易度色、WORLD'S ENDは専用の虹色になる。
  assert.deepEqual(labels, ['ULT', 'WE'])
  assert.ok(badgeClasses[0].includes('bg-difficulty-ultima-bg'))
  assert.ok(badgeClasses[1].includes('bg-[image:var(--cs-color-worldsend-label-bg)]'))
})

test('通常譜面の難易度は大文字小文字を区別せず短縮表記へ変換すること', () => {
  // Given: 小文字のEXPERT。
  const change = createSongChange({ diff: 'expert' as PlayerDataSongRecordChange['diff'] })

  // When
  const result = getRegisterScoreShortDifficultyLabel(change)

  // Then: バッジ色と同じく大文字のドメイン値として扱う。
  assert.equal(result, 'EXP')
})

test('通常譜面で未対応の難易度はプレースホルダーを表示すること', () => {
  // Given: 通常譜面に不正なWE難易度が入った差分。
  const change = createSongChange({ diff: 'WE' })

  // When
  const result = getRegisterScoreShortDifficultyLabel(change)

  // Then
  assert.equal(result, REGISTER_SCORE_NO_DATA_TEXT)
})

test('集計行の難易度ラベルは難易度ごとの文字色にし、全体行は色を付けないこと', () => {
  // Given / When
  const master = getRegisterScoreStatisticDifficultyTextClass('MASTER')
  const worldsend = getRegisterScoreStatisticDifficultyTextClass('WE')
  const overall = getRegisterScoreStatisticDifficultyTextClass(null)

  // Then
  assert.equal(master, 'text-[var(--cs-color-difficulty-master-bg)]')
  assert.equal(worldsend, 'text-[var(--cs-color-worldsend-label-bg)]')
  assert.equal(overall, '')
})

test('RECORD STATISTICSはMAX列の左側だけに区切り線を引くこと', () => {
  // Given / When
  const max = getRegisterScoreStatisticColumnDividerClass('MAX')
  const fc = getRegisterScoreStatisticColumnDividerClass('FC')

  // Then
  assert.equal(max, 'border-l border-border')
  assert.equal(fc, '')
})

test('楽曲のランプを大文字へ正規化し、未対応の値は表示しないこと', () => {
  // Given: 小文字のランプと未対応のコンボランプ。
  const state = createRecordState({
    clear_lamp: 'hard',
    combo_lamp: 'unknown combo',
    full_chain: 'full chain gold',
  })

  // When
  const result = toRegisterScoreLampRecord(state)

  // Then: 表示対応済みのランプだけが大文字で残る。
  assert.deepEqual(result, {
    is_played: true,
    score: 1_000_000,
    clear_lamp: 'HARD',
    combo_lamp: null,
    full_chain: 'FULL CHAIN GOLD',
  })
})

test('コースのランプはCLEAR状態とコンボランプだけを表示すること', () => {
  // Given: クリア済みでフルコンボのコース。
  const state = { score: 3_000_000, is_clear: true, combo_lamp: 'full combo' }

  // When
  const result = toRegisterScoreCourseLampRecord(state)

  // Then: CLEARとFULL COMBOを持ち、フルチェインは持たない。
  assert.deepEqual(result, {
    is_played: true,
    score: 3_000_000,
    clear_lamp: 'CLEAR',
    combo_lamp: 'FULL COMBO',
    full_chain: null,
  })
})

test('登録日時は実行環境のタイムゾーンによらずJSTで表示すること', () => {
  // Given: UTCで表した登録日時。
  const importedAt = '2026-11-07T15:04:05Z'

  // When
  const result = formatRegisterScoreImportedAt(importedAt)

  // Then: JSTでは翌日の00時台になる。
  assert.equal(result, '2026/11/08 00:04:05')
})

test('解釈できない登録日時はプレースホルダーを表示すること', () => {
  // Given
  const importedAt = 'not-a-date'

  // When
  const result = formatRegisterScoreImportedAt(importedAt)

  // Then
  assert.equal(result, REGISTER_SCORE_NO_DATA_TEXT)
})
