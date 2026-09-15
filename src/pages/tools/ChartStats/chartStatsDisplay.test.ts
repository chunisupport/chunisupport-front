import assert from 'node:assert/strict'
import test from 'node:test'
import type { StandardChartStats, WorldsendChartStats } from '../../../types/chartStats'
import {
  formatChartStatsGeneratedAt,
  formatChartStatsLevel,
  formatChartStatsValue,
} from './chartStatsDisplay'

const sharedStats = {
  song_id: 'song',
  title: '楽曲',
  player_count: 100,
  rank: { max: 0, sssp: 0, sss: 0, ssp: 0, ss: 0, sp: 0, s: 0, aaal: 100 },
  clear: { failed: 0, clear: 0, hard: 0, brave: 0, absolute: 0, catastrophy: 0 },
  combo: { none: 100, fc: 0, aj: 0, ajc: 0 },
}

test('統計値を人数または小数点以下2桁の割合へ整形すること', () => {
  // Given / When / Then
  assert.equal(formatChartStatsValue(1234, 2000, 'count'), '1,234')
  assert.equal(formatChartStatsValue(1, 3, 'percent'), '33.33%')
  assert.equal(formatChartStatsValue(0, 0, 'percent'), '-')
})

test("通常譜面とWORLD'S END譜面のレベル情報を整形すること", () => {
  // Given
  const standard: StandardChartStats = {
    ...sharedStats,
    const: 14.5,
    is_const_unknown: true,
  }
  const worldsend: WorldsendChartStats = {
    ...sharedStats,
    level_star: 3,
    attribute: '蔵',
  }

  // When & Then
  assert.equal(formatChartStatsLevel(standard), '14.5?')
  assert.equal(formatChartStatsLevel(worldsend), '★3 蔵')
})

test('生成日時を日本時間で表示し、不正な日時はハイフンにすること', () => {
  // Given / When / Then
  assert.equal(formatChartStatsGeneratedAt('2026-09-15T18:00:40+09:00'), '2026/09/15 18:00')
  assert.equal(formatChartStatsGeneratedAt('invalid'), '-')
})
