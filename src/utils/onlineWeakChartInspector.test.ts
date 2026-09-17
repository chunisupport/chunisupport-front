import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import {
  compareRecordsWithRatingBand,
  filterOnlineWeakChartEntries,
  formatOnlineWeakChartTooltipDetail,
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

test('Onlineの表示・集計範囲は難易度と点差と譜面定数をともに絞る', () => {
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

  // When: MASTERとULTIMA、定数14～15、点差±10000へ絞る。
  const result = filterOnlineWeakChartEntries(entries, {
    difficulties: ['MASTER', 'ULTIMA'],
    differenceRange: 10000,
    constMin: 14,
    constMax: 15,
  })

  // Then: 両端の点差を含み、範囲外の譜面は除外する。
  assert.deepEqual(result, entries.slice(0, 2))
})

test('Onlineのツールチップを譜面情報と差分の簡潔な形式へ整形する', () => {
  // Given: 指定された表示例に対応するMASTER譜面。
  const chart = record({ const: 14.1, score: 1008906 })

  // When: ツールチップの譜面情報を整形する。
  const result = formatOnlineWeakChartTooltipDetail(chart, -1020)

  // Then: ラベルを省いた指定形式になる。
  assert.equal(result, 'MASTER 14.1 / 1,008,906 (-1,020)')
})
