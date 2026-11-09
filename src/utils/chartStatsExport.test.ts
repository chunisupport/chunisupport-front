import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  ChartStatsDifficulty,
  ChartStatsResponse,
  StandardChartStats,
  WorldsendChartStats,
} from '../types/chartStats'
import {
  buildChartStatsExportFilename,
  buildChartStatsExportRows,
  formatChartStatsExportContent,
  toggleChartStatsExportDifficulty,
} from './chartStatsExport'

/** UTF-8 BOM。ソース上で不可視文字にならないよう文字コードから生成する */
const BOM = String.fromCharCode(0xfeff)

/**
 * テスト用の通常譜面統計を生成する。
 *
 * @param title - 曲名。
 * @returns 各カテゴリに異なる値を持つ譜面統計。
 */
const createChart = (title = 'テスト楽曲'): StandardChartStats => ({
  song_id: `id-${title}`,
  title,
  const: 14.5,
  is_const_unknown: false,
  player_count: 100,
  rank: { max: 1, sssp: 2, sss: 3, ssp: 4, ss: 5, sp: 6, s: 7, aaal: 72 },
  combo: { ajc: 1, aj: 9, fc: 20, none: 70 },
  clear: { catastrophy: 1, absolute: 2, brave: 3, hard: 4, clear: 50, failed: 40 },
})

/**
 * テスト用のWORLD'S END譜面統計を生成する。
 *
 * @returns 星数と属性を持つ譜面統計。
 */
const createWorldsendChart = (): WorldsendChartStats => {
  const { const: _const, is_const_unknown: _isConstUnknown, ...base } = createChart('WE楽曲')
  return { ...base, level_star: 3, attribute: '招' }
}

/**
 * テスト用の静的統計JSONを生成する。
 *
 * @param difficulty - 難易度。
 * @param overrides - 上書きする項目。
 * @returns 静的統計JSON。
 */
const createResponse = (
  difficulty: ChartStatsDifficulty,
  overrides: Partial<ChartStatsResponse> = {}
): ChartStatsResponse => ({
  generated_at: '2026-11-08T16:30:00Z',
  difficulty,
  rating_band: 'ALL',
  charts: [createChart('A'), createChart('B')],
  ...overrides,
})

test('通常難易度は難易度と定数列を持ち、星数と属性列を持たないこと', () => {
  // Given
  const statsList = [createResponse('MASTER', { charts: [createChart()] })]

  // When
  const [header, row] = buildChartStatsExportRows(statsList)

  // Then
  assert.deepEqual(header, [
    'difficulty',
    'song_id',
    'title',
    'const',
    'is_const_unknown',
    'player_count',
    'rank_max',
    'rank_sssp',
    'rank_sss',
    'rank_ssp',
    'rank_ss',
    'rank_sp',
    'rank_s',
    'rank_aaal',
    'clear_catastrophy',
    'clear_absolute',
    'clear_brave',
    'clear_hard',
    'clear_clear',
    'clear_failed',
    'combo_ajc',
    'combo_aj',
    'combo_fc',
    'combo_none',
  ])
  assert.deepEqual(row, [
    'MASTER',
    'id-テスト楽曲',
    'テスト楽曲',
    14.5,
    false,
    100,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    72,
    1,
    2,
    3,
    4,
    50,
    40,
    1,
    9,
    20,
    70,
  ])
})

test('複数の通常難易度を指定順に連結すること', () => {
  // Given
  const statsList = [
    createResponse('BASIC', { charts: [createChart('A')] }),
    createResponse('MASTER', { charts: [createChart('B')] }),
  ]

  // When
  const rows = buildChartStatsExportRows(statsList)

  // Then
  assert.deepEqual(
    rows.slice(1).map((row) => row.slice(0, 3)),
    [
      ['BASIC', 'id-A', 'A'],
      ['MASTER', 'id-B', 'B'],
    ]
  )
})

test("WORLD'S ENDは定数列の代わりに星数と属性列を書き出すこと", () => {
  // Given
  const statsList = [createResponse("WORLD'S END", { charts: [createWorldsendChart()] })]

  // When
  const [header, row] = buildChartStatsExportRows(statsList)

  // Then
  assert.deepEqual(header.slice(0, 6), [
    'difficulty',
    'song_id',
    'title',
    'level_star',
    'attribute',
    'player_count',
  ])
  assert.deepEqual(row.slice(0, 6), ["WORLD'S END", 'id-WE楽曲', 'WE楽曲', 3, '招', 100])
})

test('ファイル名は選んだ難易度識別子をつなぎ、最も新しいJSTの生成日を含むこと', () => {
  // Given
  const statsList = [
    createResponse('BASIC', { generated_at: '2026-11-07T00:00:00Z' }),
    createResponse('MASTER', { generated_at: '2026-11-08T16:30:00Z' }),
  ]

  // When
  const filename = buildChartStatsExportFilename(statsList, 'csv')

  // Then
  assert.equal(filename, 'chart-stats_BASIC-MASTER_20261109.csv')
})

test('通常難易度をすべて選んだ場合はファイル名の難易度部分をALLにすること', () => {
  // Given
  const difficulties: ChartStatsDifficulty[] = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']
  const statsList = difficulties.map((difficulty) => createResponse(difficulty))

  // When
  const filename = buildChartStatsExportFilename(statsList, 'tsv')

  // Then
  assert.equal(filename, 'chart-stats_ALL_20261109.tsv')
})

test("WORLD'S ENDのファイル名はWORLDS_ENDを使うこと", () => {
  // Given
  const statsList = [createResponse("WORLD'S END")]

  // When
  const filename = buildChartStatsExportFilename(statsList, 'csv')

  // Then
  assert.equal(filename, 'chart-stats_WORLDS_END_20261109.csv')
})

test("通常難易度を追加選択すると表示順に並び、WORLD'S ENDの選択は外れること", () => {
  // Given
  const current: ChartStatsDifficulty[] = ["WORLD'S END"]

  // When
  const withMaster = toggleChartStatsExportDifficulty(current, 'MASTER', true)
  const withBasic = toggleChartStatsExportDifficulty(withMaster, 'BASIC', true)

  // Then
  assert.deepEqual(withMaster, ['MASTER'])
  assert.deepEqual(withBasic, ['BASIC', 'MASTER'])
})

test("WORLD'S ENDを選ぶと通常難易度の選択が外れ、選択解除はその難易度だけを外すこと", () => {
  // Given
  const current: ChartStatsDifficulty[] = ['BASIC', 'MASTER']

  // When
  const withWorldsend = toggleChartStatsExportDifficulty(current, "WORLD'S END", true)
  const withoutBasic = toggleChartStatsExportDifficulty(current, 'BASIC', false)

  // Then
  assert.deepEqual(withWorldsend, ["WORLD'S END"])
  assert.deepEqual(withoutBasic, ['MASTER'])
})

test('生成日時が不正な場合はファイル名から日付を省くこと', () => {
  // Given
  const statsList = [createResponse('MASTER', { generated_at: 'invalid' })]

  // When
  const filename = buildChartStatsExportFilename(statsList, 'json')

  // Then
  assert.equal(filename, 'chart-stats_MASTER.json')
})

test('JSONは難易度ごとの静的統計JSONをstats配列に並べること', () => {
  // Given
  const statsList = [createResponse('EXPERT'), createResponse('MASTER')]

  // When
  const content = formatChartStatsExportContent(statsList, 'json')

  // Then
  assert.deepEqual(JSON.parse(content), { stats: statsList })
})

test('CSVとTSVはUTF-8 BOMで始まり、ヘッダーと全難易度の譜面数分の行を持つこと', () => {
  // Given
  const statsList = [createResponse('EXPERT'), createResponse('MASTER')]

  // When
  const csv = formatChartStatsExportContent(statsList, 'csv')
  const tsv = formatChartStatsExportContent(statsList, 'tsv')

  // Then
  assert.ok(csv.startsWith(`${BOM}difficulty,song_id,title,`))
  assert.ok(tsv.startsWith(`${BOM}difficulty\tsong_id\ttitle\t`))
  assert.equal(csv.trimEnd().split('\r\n').length, 5)
})
