import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import {
  compareRecordsWithRatingBand,
  filterOnlineWeakChartEntries,
  formatOnlineWeakChartTooltipDetail,
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  resolveOnlineWeakChartScoreDifficulties,
  sortOnlineWeakChartEntries,
  toggleOnlineWeakChartDifficulty,
} from './onlineWeakChartInspector'

const record = (changes: Partial<PlayerRecordDTO>): PlayerRecordDTO =>
  ({
    id: 'song-1',
    difficulty: 'MASTER',
    score: 1005000,
    is_played: true,
    ...changes,
  }) as PlayerRecordDTO

test('選択レート帯の平均があるプレイ済み譜面だけを差分へ変換する', () => {
  // Given: MASTERの平均は小数で、ULTIMAと未プレイ譜面は比較できない。
  const snapshots: ChartScoresResponse[] = [
    {
      generated_at: '2026-09-17T00:00:00+09:00',
      difficulty: 'MASTER',
      charts: [
        {
          song_id: 'song-1',
          scores: [
            { rating_band: 'ALL', average_score: 1006000, median_score: 1006000 },
            { rating_band: '16.0', average_score: 1007000.75, median_score: 1007100 },
          ],
        },
        {
          song_id: 'song-2',
          scores: [{ rating_band: '16.0', average_score: null, median_score: null }],
        },
      ],
    },
  ]

  // When: 選択レート帯と照合する。
  const result = compareRecordsWithRatingBand(
    [
      record({}),
      record({ id: 'song-2' }),
      record({ id: 'song-1', difficulty: 'ULTIMA' }),
      record({ id: 'song-1', is_played: false }),
    ],
    snapshots,
    '16.0'
  )

  // Then: 対応する平均を切り捨て、負の差を返す。
  assert.equal(result.length, 1)
  assert.equal(result[0].averageScore, 1007000.75)
  assert.equal(result[0].difference, -2000)
})

test('Onlineの表示範囲は難易度と点差と譜面定数をともに絞る', () => {
  // Given: 境界値と範囲外の比較結果。
  const entries = [
    {
      record: record({ const: 14, difficulty: 'MASTER' }),
      averageScore: 1000000,
      difference: -10000,
    },
    {
      record: record({ const: 15, difficulty: 'ULTIMA' }),
      averageScore: 1000000,
      difference: 10000,
    },
    { record: record({ const: 13.9 }), averageScore: 1000000, difference: 0 },
    { record: record({ const: 14 }), averageScore: 1000000, difference: -10001 },
    { record: record({ const: 14, difficulty: 'EXPERT' }), averageScore: 1000000, difference: 0 },
  ]

  // When: 表示対象をMASTERとULTIMA、定数14～15、点差±10000へ絞る。
  const result = filterOnlineWeakChartEntries(entries, {
    difficulties: ['MASTER', 'ULTIMA'],
    displayScoreRange: 10000,
    constMin: 14,
    constMax: 15,
    genres: null,
    versions: null,
  })

  // Then: 両端の点差を含み、範囲外の譜面は除外する。
  assert.deepEqual(result, entries.slice(0, 2))
})

test('理論値OP対象では現在のOP対象フラグではなく楽曲マスタの対象難易度を使う', () => {
  // Given: 現在のOP対象と理論値OP対象が反対になっている2曲。
  const entries = [
    {
      record: record({ id: 'song-1', difficulty: 'MASTER', const: 14, is_op_target: true }),
      averageScore: 1000000,
      difference: 0,
    },
    {
      record: record({ id: 'song-1', difficulty: 'ULTIMA', const: 15, is_op_target: false }),
      averageScore: 1000000,
      difference: 0,
    },
    {
      record: record({ id: 'song-2', difficulty: 'MASTER', const: 14.5, is_op_target: false }),
      averageScore: 1000000,
      difference: 0,
    },
    {
      record: record({ id: 'song-2', difficulty: 'ULTIMA', const: 14, is_op_target: true }),
      averageScore: 1000000,
      difference: 0,
    },
  ]
  const targetDifficultyBySongId = new Map([
    ['song-1', 'ULTIMA'] as const,
    ['song-2', 'MASTER'] as const,
  ])

  // When: 理論値OP対象だけに絞り込む。
  const result = filterOnlineWeakChartEntries(
    entries,
    {
      difficulties: [ONLINE_WEAK_CHART_OP_TARGET_FILTER],
      displayScoreRange: 10000,
      constMin: 1,
      constMax: 16,
      genres: null,
      versions: null,
    },
    undefined,
    targetDifficultyBySongId
  )

  // Then: 各曲の楽曲マスタが示す難易度だけが残る。
  assert.deepEqual(
    result.map(({ record: currentRecord }) => `${currentRecord.id}:${currentRecord.difficulty}`),
    ['song-1:ULTIMA', 'song-2:MASTER']
  )
})

test('理論値OP対象では対象難易度を解決できないレコードを除外する', () => {
  // Given: 対象難易度なしと楽曲マスタなしの比較結果。
  const entries = [
    {
      record: record({ id: 'without-target', difficulty: 'MASTER', const: 14 }),
      averageScore: 1000000,
      difference: 0,
    },
    {
      record: record({ id: 'missing-song', difficulty: 'MASTER', const: 14 }),
      averageScore: 1000000,
      difference: 0,
    },
  ]
  const targetDifficultyBySongId = new Map([['other-song', 'ULTIMA'] as const])

  // When: 理論値OP対象だけに絞り込む。
  const result = filterOnlineWeakChartEntries(
    entries,
    {
      difficulties: [ONLINE_WEAK_CHART_OP_TARGET_FILTER],
      displayScoreRange: 10000,
      constMin: 1,
      constMax: 16,
      genres: null,
      versions: null,
    },
    undefined,
    targetDifficultyBySongId
  )

  // Then: フォールバックせず全件が除外される。
  assert.deepEqual(result, [])
})

test('理論値OP対象と通常難易度は排他選択になる', () => {
  // Given: MASTERとULTIMAを選択中。
  const selected = ['MASTER', 'ULTIMA'] as const

  // When: 理論値OP対象を選び、解除後にMASTERを選び直す。
  const opTargetSelected = toggleOnlineWeakChartDifficulty(
    selected,
    ONLINE_WEAK_CHART_OP_TARGET_FILTER
  )
  const opTargetCleared = toggleOnlineWeakChartDifficulty(
    opTargetSelected,
    ONLINE_WEAK_CHART_OP_TARGET_FILTER
  )
  const masterSelected = toggleOnlineWeakChartDifficulty(opTargetSelected, 'MASTER')

  // Then: 理論値OP対象は単独選択となり、解除と通常難易度への切り替えができる。
  assert.deepEqual(opTargetSelected, [ONLINE_WEAK_CHART_OP_TARGET_FILTER])
  assert.deepEqual(opTargetCleared, [])
  assert.deepEqual(masterSelected, ['MASTER'])
})

test('理論値OP対象の平均スコア取得難易度はMASTERとULTIMAになる', () => {
  // Given: 理論値OP対象だけを選択している。

  // When: 静的スコア統計の取得難易度を解決する。
  const result = resolveOnlineWeakChartScoreDifficulties([ONLINE_WEAK_CHART_OP_TARGET_FILTER])

  // Then: MASTERとULTIMAだけを取得対象にする。
  assert.deepEqual(result, ['MASTER', 'ULTIMA'])
})

test('Onlineのジャンルとバージョンは表示時の属性フィルタとして適用する', () => {
  // Given: 比較結果と楽曲マスタ由来の属性。
  const entries = [
    { record: record({ id: 'song-p', const: 14 }), averageScore: 1000000, difference: 0 },
    { record: record({ id: 'song-v', const: 14 }), averageScore: 1000000, difference: 0 },
    {
      record: record({ id: 'song-unknown', const: 14 }),
      averageScore: 1000000,
      difference: 0,
    },
  ]
  const attributesBySongId = new Map([
    ['song-p', { genre: 'POPS & ANIME', version: 'CHUNITHM' }],
    ['song-v', { genre: 'niconico', version: 'CHUNITHM' }],
  ])

  // When: ジャンルとバージョンを指定して表示対象を絞る。
  const result = filterOnlineWeakChartEntries(
    entries,
    {
      difficulties: ['MASTER'],
      displayScoreRange: 10000,
      constMin: 1,
      constMax: 16,
      genres: ['POPS & ANIME'],
      versions: ['CHUNITHM'],
    },
    attributesBySongId
  )

  // Then: 両方の属性に一致する譜面だけが残る。
  assert.deepEqual(result, [entries[0]])
})

test('Onlineのツールチップを譜面情報と差分の簡潔な形式へ整形する', () => {
  // Given: 指定された表示例に対応するMASTER譜面。
  const chart = record({ const: 14.1, score: 1008906 })

  // When: ツールチップの譜面情報を整形する。
  const result = formatOnlineWeakChartTooltipDetail(chart, -1020)

  // Then: ラベルを省いた指定形式になる。
  assert.equal(result, 'MASTER 14.1 / 1,008,906 (-1,020)')
})

test('Onlineの比較表を各列の昇順・降順で安定してソートする', () => {
  // Given: 曲名、難易度、定数、スコア、平均、点差が異なる比較結果。
  const entries = [
    {
      record: record({
        id: 'song-c',
        title: 'Gamma',
        difficulty: 'ULTIMA',
        const: 15,
        score: 1004000,
      }),
      averageScore: 1005000,
      difference: -1000,
    },
    {
      record: record({
        id: 'song-a',
        title: 'Alpha',
        difficulty: 'MASTER',
        const: 14,
        score: 1005000,
      }),
      averageScore: 1006000,
      difference: -1000,
    },
    {
      record: record({
        id: 'song-b',
        title: 'Beta',
        difficulty: 'ADVANCED',
        const: 13,
        score: 1007000,
      }),
      averageScore: 1004000,
      difference: 3000,
    },
  ]

  // When: 各列を昇順・降順でソートする。
  const ascendingIds = (key: Parameters<typeof sortOnlineWeakChartEntries>[1]) =>
    sortOnlineWeakChartEntries(entries, key, 'asc').map(
      ({ record: currentRecord }) => currentRecord.id
    )
  const descendingIds = (key: Parameters<typeof sortOnlineWeakChartEntries>[1]) =>
    sortOnlineWeakChartEntries(entries, key, 'desc').map(
      ({ record: currentRecord }) => currentRecord.id
    )

  // Then: 各列の値に対応した順序になり、同値の点差は元の順序を保つ。
  assert.deepEqual(ascendingIds('title'), ['song-a', 'song-b', 'song-c'])
  assert.deepEqual(ascendingIds('difficulty'), ['song-b', 'song-a', 'song-c'])
  assert.deepEqual(ascendingIds('const'), ['song-b', 'song-a', 'song-c'])
  assert.deepEqual(ascendingIds('score'), ['song-c', 'song-a', 'song-b'])
  assert.deepEqual(ascendingIds('averageScore'), ['song-b', 'song-c', 'song-a'])
  assert.deepEqual(ascendingIds('difference'), ['song-c', 'song-a', 'song-b'])
  assert.deepEqual(descendingIds('difference'), ['song-b', 'song-c', 'song-a'])
})
