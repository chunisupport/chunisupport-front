import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataRecordChange, PlayerDataSongRecordChange } from '../../types/api'
import { hasRegisterScoreImageChanges } from './registerScoreImageVisibility'

/**
 * テスト用の楽曲差分を生成する。
 *
 * @param idx - 差分を識別する楽曲ID。
 * @returns 指定した楽曲IDを持つテスト用差分。
 */
const createChange = (idx: string): PlayerDataSongRecordChange => ({
  record_type: 'standard',
  change_type: 'updated',
  idx,
  diff: 'MASTER',
  before: null,
  after: {
    score: 1_000_000,
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
  },
})

/**
 * テスト用差分から画像除外判定に使うキーを返す。
 *
 * @param change - キーへ変換する更新差分。
 * @returns 差分の楽曲またはコースID。
 */
const resolveChangeKey = (change: PlayerDataRecordChange): string => change.idx

test('セクション内に画像へ含めるカードが残っていればtrueを返す', () => {
  // Given: 2枚のカードのうち1枚だけを画像から除外している。
  const changes = [createChange('song-1'), createChange('song-2')]
  const excludedChangeKeys = new Set(['song-1'])

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, excludedChangeKeys, resolveChangeKey)

  // Then: 画像へ含めるカードが残っていると判定する。
  assert.equal(result, true)
})

test('セクション内のすべてのカードを画像から除外していればfalseを返す', () => {
  // Given: セクション内のすべてのカードを画像から除外している。
  const changes = [createChange('song-1'), createChange('song-2')]
  const excludedChangeKeys = new Set(['song-1', 'song-2'])

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, excludedChangeKeys, resolveChangeKey)

  // Then: 画像へ含めるカードは残っていないと判定する。
  assert.equal(result, false)
})

test('空のセクションには画像へ含めるカードがないと判定する', () => {
  // Given: セクションにカードがない。
  const changes: PlayerDataSongRecordChange[] = []

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, new Set(), resolveChangeKey)

  // Then: 画像へ含めるカードはないと判定する。
  assert.equal(result, false)
})
