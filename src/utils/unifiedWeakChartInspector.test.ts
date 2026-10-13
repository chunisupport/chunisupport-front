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
 * @param threshold - 弱点判定に使う最小点差。
 * @returns 分類済みの譜面一覧。
 */
const inspect = (
  records: readonly PlayerRecordDTO[],
  averages: readonly TestAverage[],
  threshold = 1000
) => inspectUnifiedWeakCharts(records, createSnapshots(averages), RATING_BAND, threshold)

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

test('閾値ちょうどの差は確認済み弱点、それ未満の差は個人弱点にする', () => {
  // Given: 975,000点の譜面は他の4譜面から見てLOW外れ値となる。
  const records = [
    createRecord('low', 975000),
    createRecord('base-1', 1000000),
    createRecord('base-2', 1001000),
    createRecord('base-3', 1002000),
    createRecord('base-4', 1003000),
  ]
  const exactThresholdAverages = records.map(({ id, score }) => ({
    songId: id,
    difficulty: 'MASTER' as const,
    averageScore: id === 'low' ? score + 1000 : score,
  }))
  const belowThresholdAverages = exactThresholdAverages.map((average) =>
    average.songId === 'low' ? { ...average, averageScore: 975999 } : average
  )

  // When: 平均との差が閾値ちょうどの場合と、1点だけ閾値に届かない場合を調べる。
  const exactThreshold = findEntry(inspect(records, exactThresholdAverages), 'low')
  const belowThreshold = findEntry(inspect(records, belowThresholdAverages), 'low')

  // Then: 閾値ちょうどは確認済み、閾値未満は個人弱点になる。
  assert.equal(exactThreshold.difference, -1000)
  assert.equal(exactThreshold.category, 'confirmedWeakness')
  assert.equal(belowThreshold.difference, -999)
  assert.equal(belowThreshold.category, 'personalWeakness')
})

test('閾値0でも平均未満だけを弱点とし、同点は通常にする', () => {
  // Given: 個人外れ値のないスコア分布で、1譜面だけを平均未満、1譜面を平均と同点にする。
  const records = [1000000, 1000100, 1000200, 1000300, 1000400].map((score, index) =>
    createRecord(`song-${index}`, score)
  )
  const averages = records.map((record, index) => ({
    songId: record.id,
    difficulty: 'MASTER' as const,
    averageScore: record.score + (index === 0 ? 1 : 0),
  }))

  // When: 弱点判定の閾値を0にする。
  const entries = inspect(records, averages, 0)

  // Then: 1点でも平均未満なら隠れ弱点、同点は通常になる。
  assert.equal(findEntry(entries, 'song-0').difference, -1)
  assert.equal(findEntry(entries, 'song-0').category, 'hiddenWeakness')
  assert.equal(findEntry(entries, 'song-1').difference, 0)
  assert.equal(findEntry(entries, 'song-1').category, 'normal')
})

test('平均統計がない譜面も個人Tukeyの母集団に残す', () => {
  // Given: 平均なしとnull平均の譜面を加えると、975,000点はLOW外れ値ではなくなる。
  const records = [
    createRecord('low', 975000),
    createRecord('missing-average', 980000),
    createRecord('null-average', 982000),
    createRecord('base-1', 1000000),
    createRecord('base-2', 1001000),
    createRecord('base-3', 1002000),
    createRecord('base-4', 1003000),
  ]
  const averages = records
    .filter(({ id }) => id !== 'missing-average')
    .map(({ id, score }) => ({
      songId: id,
      difficulty: 'MASTER' as const,
      averageScore: id === 'low' ? score + 10000 : id === 'null-average' ? null : score,
    }))

  // When: レート帯平均がある譜面だけをオンライン比較する。
  const entries = inspect(records, averages)

  // Then: 平均なし譜面は unavailable で残り、LOW判定を変えるTukeyの母集団にも含まれる。
  assert.equal(findEntry(entries, 'missing-average').category, 'unavailable')
  assert.equal(findEntry(entries, 'null-average').category, 'unavailable')
  assert.equal(findEntry(entries, 'low').personalOutlier, null)
  assert.equal(findEntry(entries, 'low').category, 'hiddenWeakness')
})

test('未プレイ譜面と理論値超過スコアを出力とTukeyの母集団から除外する', () => {
  // Given: 適格な5譜面に、未プレイの0点と上限を1点超える譜面を加える。
  const eligibleRecords = [
    createRecord('low', 975000),
    createRecord('base-1', 1000000),
    createRecord('base-2', 1001000),
    createRecord('base-3', 1002000),
    createRecord('base-4', 1003000),
  ]
  const excludedRecords = [
    createRecord('unplayed', 0, 'MASTER', { is_played: false }),
    createRecord('over-score', 1010001),
  ]
  const records = [...eligibleRecords, ...excludedRecords]
  const averages = records.map(({ id, score }) => ({
    songId: id,
    difficulty: 'MASTER' as const,
    averageScore: id === 'low' ? score + 1000 : score,
  }))

  // When: 全レコードを分析関数へ渡す。
  const entries = inspect(records, averages)

  // Then: 不適格レコードは結果に含まれず、LOW譜面は適格レコードだけのTukeyで判定される。
  assert.deepEqual(
    entries.map(({ record }) => record.id).sort(),
    eligibleRecords.map(({ id }) => id).sort()
  )
  assert.equal(findEntry(entries, 'low').personalOutlier, 'LOW')
  assert.equal(findEntry(entries, 'low').category, 'confirmedWeakness')
})

test('同じ楽曲IDでも難易度ごとの平均を照合し、平均値の小数部分を切り捨てる', () => {
  // Given: 同じ楽曲IDのMASTERとULTIMAに異なるレート帯平均を用意する。
  const records = [
    createRecord('shared-song', 1000000, 'MASTER'),
    createRecord('shared-song', 1005000, 'ULTIMA'),
    ...[1000000, 1001000, 1002000, 1003000].map((score, index) =>
      createRecord(`base-${index}`, score)
    ),
  ]
  const averages = [
    { songId: 'shared-song', difficulty: 'MASTER', averageScore: 1001000.9 },
    { songId: 'shared-song', difficulty: 'ULTIMA', averageScore: 1003000.9 },
    ...records
      .filter(({ id }) => id !== 'shared-song')
      .map(({ id, score }) => ({ songId: id, difficulty: 'MASTER' as const, averageScore: score })),
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

test('分類の優先順、差分順、同点時の読み順で並べる', () => {
  // Given: 各分類に該当する譜面、平均なし、高スコア側外れ値、読みと曲名の順が異なる同点譜面を用意する。
  const readingI = {
    ...createRecord('normal-reading-i', 1002000, 'MASTER', { title: 'あ' }),
    reading: 'イ',
  }
  const readingA = {
    ...createRecord('normal-reading-a', 1002000, 'MASTER', { title: 'い' }),
    reading: 'ア',
  }
  const records = [
    createRecord('confirmed', 500000),
    createRecord('personal', 510000),
    createRecord('hidden-farther', 1000000),
    createRecord('hidden-nearer', 1001000),
    readingI,
    readingA,
    createRecord('positive-strength', 1003000),
    createRecord('unavailable', 1004000),
    createRecord('high-outlier', 1010000),
  ]
  const averages = [
    { songId: 'confirmed', difficulty: 'MASTER', averageScore: 530000 },
    { songId: 'personal', difficulty: 'MASTER', averageScore: 515000 },
    { songId: 'hidden-farther', difficulty: 'MASTER', averageScore: 1040000 },
    { songId: 'hidden-nearer', difficulty: 'MASTER', averageScore: 1031000 },
    { songId: 'normal-reading-i', difficulty: 'MASTER', averageScore: 1002000 },
    { songId: 'normal-reading-a', difficulty: 'MASTER', averageScore: 1002000 },
    { songId: 'positive-strength', difficulty: 'MASTER', averageScore: 1002000 },
    { songId: 'high-outlier', difficulty: 'MASTER', averageScore: 1000000 },
  ] as const

  // When: 分類結果を取得する。
  const entries = inspect(records, averages, 10000)

  // Then: 分類優先順を守り、分類内は差分昇順、同点の通常譜面は読み順にする。
  assert.deepEqual(
    entries.map(({ record }) => record.id),
    [
      'confirmed',
      'hidden-farther',
      'hidden-nearer',
      'personal',
      'normal-reading-a',
      'normal-reading-i',
      'positive-strength',
      'high-outlier',
      'unavailable',
    ]
  )
  assert.deepEqual(
    entries.map(({ category }) => category),
    [
      'confirmedWeakness',
      'hiddenWeakness',
      'hiddenWeakness',
      'personalWeakness',
      'normal',
      'normal',
      'strength',
      'strength',
      'unavailable',
    ]
  )
  assert.equal(findEntry(entries, 'high-outlier').personalOutlier, 'HIGH')
})
