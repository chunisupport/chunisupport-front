import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import { excludeLockedSongRecords } from './lockedSongRecords'

/**
 * テスト用の通常譜面レコードを作る。
 *
 * @param id - 楽曲ID。
 * @param difficulty - 難易度。
 * @returns 指定した楽曲ID・難易度のレコード。
 */
const createRecord = (id: string, difficulty: PlayerRecordDTO['difficulty']): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty,
  id,
  title: id,
  artist: '',
  const: 14.5,
  is_const_unknown: false,
  score: 1_009_000,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
})

test('楽曲単位の未解禁設定は全難易度、ULTIMAのみの設定はULTIMA譜面だけを除外すること', () => {
  // Given
  const records = [
    createRecord('locked', 'MASTER'),
    createRecord('locked', 'ULTIMA'),
    createRecord('ultima-locked', 'MASTER'),
    createRecord('ultima-locked', 'ULTIMA'),
    createRecord('unlocked', 'ULTIMA'),
  ]
  const lockedSongs = [
    { id: 'locked', is_ultima: false },
    { id: 'ultima-locked', is_ultima: true },
  ]

  // When
  const result = excludeLockedSongRecords(records, lockedSongs)

  // Then
  assert.deepEqual(
    result.map((record) => `${record.id}:${record.difficulty}`),
    ['ultima-locked:MASTER', 'unlocked:ULTIMA']
  )
})

test('未解禁設定がない場合はすべてのレコードを残すこと', () => {
  // Given
  const records = [createRecord('song', 'MASTER')]

  // When
  const result = excludeLockedSongRecords(records, [])

  // Then
  assert.deepEqual(result, records)
})
