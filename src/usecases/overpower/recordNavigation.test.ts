import assert from 'node:assert/strict'
import test from 'node:test'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { DEFAULT_FILTER } from '../../utils/recordFilterDefaults'
import { buildOverPowerRecordFilter } from './recordNavigation'

test('ジャンル行と単一難易度を通常レコードフィルターへ変換する', () => {
  // Given
  const params = {
    defaultFilter: DEFAULT_FILTER,
    dimension: 'genre' as const,
    rowLabel: 'POPS & ANIME',
    aggregationTarget: 'EXPERT' as const,
    excludeLockedSongs: true,
  }

  // When
  const result = buildOverPowerRecordFilter(params)

  // Then
  assert.deepEqual(result.genres, ['POPS & ANIME'])
  assert.deepEqual(result.difficulties, ['EXPERT'])
  assert.equal(result.excludeLockedSongs, true)
  assert.equal(result.opTargetOnly, false)
})

test('プラス付きレベル行を対応する譜面定数範囲へ変換する', () => {
  // Given
  const params = {
    defaultFilter: DEFAULT_FILTER,
    dimension: 'level' as const,
    rowLabel: '14+',
    aggregationTarget: 'MASTER_ULTIMA' as const,
    excludeLockedSongs: false,
  }

  // When
  const result = buildOverPowerRecordFilter(params)

  // Then
  assert.deepEqual(result.const, { min: 14.5, max: 14.9 })
  assert.equal(result.constFilterMode, 'level')
  assert.deepEqual(result.difficulties, ['MASTER', 'ULTIMA'])
})

test('OP対象の全体行では全難易度から現在のOP対象だけを選ぶ', () => {
  // Given
  const params = {
    defaultFilter: DEFAULT_FILTER,
    dimension: 'all' as const,
    rowLabel: 'ALL',
    aggregationTarget: 'OP_TARGET' as const,
    excludeLockedSongs: true,
  }

  // When
  const result = buildOverPowerRecordFilter(params)

  // Then
  assert.deepEqual(result.difficulties, PLAYER_DATA_DIFFICULTIES)
  assert.equal(result.opTargetOnly, true)
  assert.equal(result.opTargetType, 'current')
  assert.equal(result.excludeLockedSongs, true)
})

test('バージョン行と全難易度を通常レコードフィルターへ変換する', () => {
  // Given
  const params = {
    defaultFilter: DEFAULT_FILTER,
    dimension: 'version' as const,
    rowLabel: 'VERSE',
    aggregationTarget: 'ALL' as const,
    excludeLockedSongs: false,
  }

  // When
  const result = buildOverPowerRecordFilter(params)

  // Then
  assert.deepEqual(result.versions, ['VERSE'])
  assert.deepEqual(result.difficulties, PLAYER_DATA_DIFFICULTIES)
  assert.equal(result.opTargetOnly, false)
})
