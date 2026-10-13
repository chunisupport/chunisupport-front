import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { inspectUnifiedWeakCharts } from './unifiedWeakChartInspector'

/** 統合インスペクターのテストで比較するレート帯。 */
const RATING_BAND = '16.00～16.24'

/** テスト用の譜面別平均スコア。 */
type TestAverage = {
  songId: string
  difficulty: PlayerDataDifficulty
  averageScore: number | null
}

/**
 * テスト用の通常譜面レコードを生成する。
 *
 * @param id - 楽曲ID。
 * @param score - 獲得スコア。
 * @param difficulty - レコードの難易度。
 * @param overrides - 上書きするレコード項目。
 * @returns テスト用レコード。
 */
const createRecord = (
  id: string,
  score: number,
  difficulty: PlayerDataDifficulty = 'MASTER',
  overrides: Partial<PlayerRecordDTO> = {}
): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty,
  id,
  title: id,
  artist: 'テスト',
  const: 14,
  is_const_unknown: false,
  score,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * レート帯平均の一覧から難易度別スナップショットを生成する。
 *
 * @param averages - 楽曲ID・難易度ごとの平均スコア。
 * @returns テスト用スコア統計スナップショット。
 */
const createSnapshots = (averages: readonly TestAverage[]): ChartScoresResponse[] => {
  const chartsByDifficulty = new Map<PlayerDataDifficulty, ChartScoresResponse['charts']>()

  for (const { songId, difficulty, averageScore } of averages) {
    const charts = chartsByDifficulty.get(difficulty) ?? []
    charts.push({
      song_id: songId,
      scores: [{ rating_band: RATING_BAND, average_score: averageScore, median_score: null }],
    })
    chartsByDifficulty.set(difficulty, charts)
  }

  return [...chartsByDifficulty].map(([difficulty, charts]) => ({
    generated_at: '2026-01-01T00:00:00Z',
    difficulty,
    charts,
  }))
}

/**
 * テスト用データを統合インスペクターへ渡す。
 *
 * @param records - 分析するユーザーレコード。
 * @param averages - レート帯平均の一覧。
 * @returns 分類済みの譜面一覧。
 */
const inspect = (records: readonly PlayerRecordDTO[], averages: readonly TestAverage[]) =>
  inspectUnifiedWeakCharts(records, createSnapshots(averages), RATING_BAND)

/**
 * レート帯平均との点差を指定してレコードと平均の組を作る。
 *
 * @param charts - 楽曲ID、譜面定数、点差の一覧。スコアは1,000,000点で固定する。
 * @returns レコードとレート帯平均。
 */
const createCharts = (
  charts: readonly { id: string; chartConst?: number; difference: number }[]
): { records: PlayerRecordDTO[]; averages: TestAverage[] } => ({
  records: charts.map(({ id, chartConst = 14 }) =>
    createRecord(id, 1000000, 'MASTER', { const: chartConst })
  ),
  averages: charts.map(({ id, difference }) => ({
    songId: id,
    difficulty: 'MASTER',
    averageScore: 1000000 - difference,
  })),
})

/**
 * 点差がほぼ同じ譜面を作る。
 *
 * @param prefix - 楽曲IDの接頭辞。
 * @param chartConst - 譜面定数。
 * @param baseDifference - 中心となる点差。
 * @returns 中心の前後にばらついた9譜面。
 */
const createSteadyCharts = (prefix: string, chartConst: number, baseDifference: number) =>
  [-40, -30, -20, -10, 0, 10, 20, 30, 40].map((offset, index) => ({
    id: `${prefix}-${index}`,
    chartConst,
    difference: baseDifference + offset,
  }))

/**
 * 譜面IDと難易度から分類結果を取得する。
 *
 * @param entries - 分類済みの譜面一覧。
 * @param id - 楽曲ID。
 * @param difficulty - 難易度。
 * @returns 一致する分類結果。
 */
const findEntry = (
  entries: ReturnType<typeof inspect>,
  id: string,
  difficulty: PlayerDataDifficulty = 'MASTER'
) => {
  const entry = entries.find(
    (candidate) => candidate.record.id === id && candidate.record.difficulty === difficulty
  )
  assert.ok(entry, `分類結果がありません: ${id}:${difficulty}`)
  return entry
}

test('平均を上回っていても、普段の差より大きく低い譜面は苦手にする', () => {
  // Given: 普段はレート帯平均を約3,000点上回り、1譜面だけ500点しか上回らない。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 3000),
    { id: 'target', difference: 500 },
  ])

  // When: 統合分析を実行する。
  const target = findEntry(inspect(records, averages), 'target')

  // Then: 平均との差は正でも、普段の差を基準に苦手と判定する。
  assert.equal(target.difference, 500)
  assert.equal(target.baseline, 2995)
  assert.equal(target.category, 'weakness')
})

test('全体的に平均を下回っていても、普段どおりの譜面は苦手にしない', () => {
  // Given: すべての譜面がレート帯平均を約3,000点下回る。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, -3000))

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 中心の譜面はふつうで、苦手と判定される譜面はない。
  assert.equal(findEntry(entries, 'steady-4').category, 'normal')
  assert.ok(entries.every(({ category }) => category !== 'weakness'))
})

test('普段の差は譜面定数の近い譜面だけで求める', () => {
  // Given: 定数12では約+5,000点、定数15では約0点が普段の差になる。
  const { records, averages } = createCharts([
    ...createSteadyCharts('low-const', 12, 5000),
    ...createSteadyCharts('high-const', 15, 0),
    { id: 'low-target', chartConst: 12.5, difference: 1000 },
    { id: 'high-target', chartConst: 14.5, difference: 1000 },
  ])

  // When: 同じ+1,000点の譜面を定数帯ごとに判定する。
  const entries = inspect(records, averages)

  // Then: 定数12付近では苦手、定数15付近では得意になる。
  assert.equal(findEntry(entries, 'low-target').baseline, 4995)
  assert.equal(findEntry(entries, 'low-target').category, 'weakness')
  assert.equal(findEntry(entries, 'high-target').baseline, 5)
  assert.equal(findEntry(entries, 'high-target').category, 'strength')
})

test('定数の近い譜面が少ない場合は比較できる全譜面で普段の差を求める', () => {
  // Given: 定数10の譜面が1つだけで、他は定数14に集まっている。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 2000),
    { id: 'isolated', chartConst: 10, difference: 0 },
  ])

  // When: 統合分析を実行する。
  const isolated = findEntry(inspect(records, averages), 'isolated')

  // Then: 全譜面の中央値を普段の差として苦手と判定する。
  assert.equal(isolated.baseline, 1995)
  assert.equal(isolated.category, 'weakness')
})

test('平均統計がない譜面はデータなしにし、普段の差の計算にも含めない', () => {
  // Given: 平均なしとnull平均の譜面を加える。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 1000))
  records.push(createRecord('missing-average', 900000), createRecord('null-average', 900000))
  averages.push({ songId: 'null-average', difficulty: 'MASTER', averageScore: null })

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 平均なし譜面は点差・普段の差を持たず、他譜面の普段の差も変わらない。
  for (const id of ['missing-average', 'null-average']) {
    const entry = findEntry(entries, id)
    assert.equal(entry.category, 'unavailable')
    assert.equal(entry.difference, null)
    assert.equal(entry.baseline, null)
  }
  assert.equal(findEntry(entries, 'steady-0').baseline, 1000)
})

test('未プレイ譜面と理論値超過スコアを出力と普段の差の計算から除外する', () => {
  // Given: 適格な譜面に、未プレイの0点と上限を1点超える譜面を加える。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 1000))
  records.push(
    createRecord('unplayed', 0, 'MASTER', { is_played: false }),
    createRecord('over-score', 1010001)
  )
  averages.push(
    { songId: 'unplayed', difficulty: 'MASTER', averageScore: 1000000 },
    { songId: 'over-score', difficulty: 'MASTER', averageScore: 0 }
  )

  // When: 全レコードを分析関数へ渡す。
  const entries = inspect(records, averages)

  // Then: 不適格レコードは結果に含まれず、普段の差にも影響しない。
  assert.equal(entries.length, 9)
  assert.equal(findEntry(entries, 'steady-0').baseline, 1000)
})

test('点差のばらつきがない場合も下限点数で割り、わずかなずれは過敏に判定しない', () => {
  // Given: 半数以上の譜面が同じ点差で、普段より50点低い譜面と6,000点低い譜面がある。
  const { records, averages } = createCharts([
    ...[0, 1, 2, 3, 4].map((index) => ({ id: `same-${index}`, difference: 1000 })),
    { id: 'near', difference: 950 },
    { id: 'far', difference: -5000 },
  ])

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: ばらつきを下限100点として、50点差はふつう、6,000点差は苦手になる。
  assert.equal(findEntry(entries, 'same-0').deviation, 0)
  assert.equal(findEntry(entries, 'near').deviation, -0.5)
  assert.equal(findEntry(entries, 'near').category, 'normal')
  assert.equal(findEntry(entries, 'far').category, 'weakness')
})

test('同じ楽曲IDでも難易度ごとの平均を照合し、平均値の小数部分を切り捨てる', () => {
  // Given: 同じ楽曲IDのMASTERとULTIMAに異なるレート帯平均を用意する。
  const records = [
    createRecord('shared-song', 1000000, 'MASTER'),
    createRecord('shared-song', 1005000, 'ULTIMA'),
  ]
  const averages = [
    { songId: 'shared-song', difficulty: 'MASTER', averageScore: 1001000.9 },
    { songId: 'shared-song', difficulty: 'ULTIMA', averageScore: 1003000.9 },
  ] as const

  // When: 楽曲IDと難易度を組み合わせてレート帯平均を照合する。
  const entries = inspect(records, averages)

  // Then: 各譜面の平均を取り違えず、差分計算前に小数を切り捨てる。
  const master = findEntry(entries, 'shared-song', 'MASTER')
  const ultima = findEntry(entries, 'shared-song', 'ULTIMA')
  assert.equal(master.averageScore, 1001000.9)
  assert.equal(master.difference, -1000)
  assert.equal(ultima.averageScore, 1003000.9)
  assert.equal(ultima.difference, 2000)
})

test('判定の優先順、ずれの小さい順、同点時の読み順で並べる', () => {
  // Given: 各判定に該当する譜面、平均なし譜面、読みと曲名の順が異なる同点譜面を用意する。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 0),
    { id: 'weakness-farther', difference: -1000 },
    { id: 'weakness-nearer', difference: -500 },
    { id: 'mild', difference: -150 },
    { id: 'strength', difference: 1000 },
  ])
  const readingI = {
    ...createRecord('reading-i', 1000000, 'MASTER', { title: 'あ' }),
    reading: 'イ',
  }
  const readingA = {
    ...createRecord('reading-a', 1000000, 'MASTER', { title: 'い' }),
    reading: 'ア',
  }
  records.push(readingI, readingA, createRecord('unavailable', 1000000))
  averages.push(
    { songId: 'reading-i', difficulty: 'MASTER', averageScore: 1000000 },
    { songId: 'reading-a', difficulty: 'MASTER', averageScore: 1000000 }
  )

  // When: 分類結果を取得する。
  const entries = inspect(records, averages)
  const ids = entries.map(({ record }) => record.id)

  // Then: 判定の優先順を守り、判定内はずれの小さい順、同点は読み順にする。
  assert.deepEqual(ids.slice(0, 3), ['weakness-farther', 'weakness-nearer', 'mild'])
  assert.ok(ids.indexOf('reading-a') < ids.indexOf('reading-i'))
  assert.deepEqual(ids.slice(-2), ['strength', 'unavailable'])
  assert.deepEqual(
    [...new Set(entries.map(({ category }) => category))],
    ['weakness', 'mildWeakness', 'normal', 'strength', 'unavailable']
  )
})
