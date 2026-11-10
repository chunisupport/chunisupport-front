import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataSongRecordChange } from '../../types/api'
import { type RegisterScoreSortSettings, sortRegisterScoreChanges } from './registerScoreSorting'

/**
 * テスト用の楽曲差分を生成する。
 *
 * @param idx - 差分を識別する楽曲ID。
 * @param diff - 差分の難易度。
 * @param recordType - 通常譜面またはWORLD'S ENDを表すレコード種別。
 * @returns 指定した条件を持つテスト用差分。
 */
const createChange = (
  idx: string,
  diff: PlayerDataSongRecordChange['diff'],
  recordType: PlayerDataSongRecordChange['record_type'] = 'standard'
): PlayerDataSongRecordChange => ({
  record_type: recordType,
  change_type: 'updated',
  idx,
  diff,
  before: null,
  after: { score: 1_000_000, clear_lamp: null, combo_lamp: null, full_chain: null },
})

/**
 * テスト用のソート設定を既定値付きで生成する。
 *
 * @param overrides - 既定値から上書きするソート設定。
 * @returns 上書きを反映したテスト用ソート設定。
 */
const createSortSettings = (
  overrides: Partial<RegisterScoreSortSettings> = {}
): RegisterScoreSortSettings => ({
  primaryKey: 'none',
  primaryDirection: 'asc',
  ...overrides,
})

const sortValues = new Map<string, { level: number | null; singleRating: number | null }>([
  ['level-10', { level: 20, singleRating: 100 }],
  ['level-10-plus', { level: 21, singleRating: 110 }],
  ['level-11', { level: 22, singleRating: 120 }],
  ['rating-low', { level: 20, singleRating: 90 }],
  ['rating-high', { level: 20, singleRating: 130 }],
  ['missing', { level: null, singleRating: null }],
])

test('ソート指定なしではAPIから受け取った順序を維持する', () => {
  // Given: API順の更新差分。
  const changes = [
    createChange('3', 'MASTER'),
    createChange('1', 'BASIC'),
    createChange('2', 'EXPERT'),
  ]

  // When: ソート設定なしで表示順を決める。
  const result = sortRegisterScoreChanges(changes, createSortSettings(), () => ({
    level: null,
    singleRating: null,
  }))

  // Then: 入力配列と同じ順序になる。
  assert.deepEqual(
    result.map((change) => change.idx),
    ['3', '1', '2']
  )
})

test('レベルは表示レベル順に昇順で並び、未解決値を末尾に置く', () => {
  // Given: レベル順が異なる更新差分。
  const changes = [
    createChange('level-11', 'MASTER'),
    createChange('missing', 'MASTER'),
    createChange('level-10-plus', 'MASTER'),
    createChange('level-10', 'MASTER'),
  ]

  // When: レベル昇順を適用する。
  const result = sortRegisterScoreChanges(
    changes,
    createSortSettings({ primaryKey: 'level' }),
    (change) => sortValues.get(change.idx) ?? { level: null, singleRating: null }
  )

  // Then: 低いレベルから並び、未解決値は末尾になる。
  assert.deepEqual(
    result.map((change) => change.idx),
    ['level-10', 'level-10-plus', 'level-11', 'missing']
  )
})

test('単曲レーティングは昇順・降順を切り替えられ、WORLD’S ENDを末尾に置く', () => {
  // Given: 単曲レーティングが異なる通常譜面とWORLD’S END。
  const changes = [
    createChange('rating-high', 'MASTER'),
    createChange('worldsend', 'WE', 'worldsend'),
    createChange('rating-low', 'MASTER'),
  ]

  // When: 単曲レーティング昇順・降順を適用する。
  const ascending = sortRegisterScoreChanges(
    changes,
    createSortSettings({ primaryKey: 'singleRating' }),
    (change) => sortValues.get(change.idx) ?? { level: null, singleRating: null }
  )
  const descending = sortRegisterScoreChanges(
    changes,
    createSortSettings({ primaryKey: 'singleRating', primaryDirection: 'desc' }),
    (change) => sortValues.get(change.idx) ?? { level: null, singleRating: null }
  )

  // Then: 数値の方向を反映し、対象外のWORLD’S ENDは末尾になる。
  assert.deepEqual(
    ascending.map((change) => change.idx),
    ['rating-low', 'rating-high', 'worldsend']
  )
  assert.deepEqual(
    descending.map((change) => change.idx),
    ['rating-high', 'rating-low', 'worldsend']
  )
})
