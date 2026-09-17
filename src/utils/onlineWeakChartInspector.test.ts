import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { compareRecordsWithRatingBand } from './onlineWeakChartInspector'

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
