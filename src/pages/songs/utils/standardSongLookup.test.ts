import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findStandardSongBpm,
  findStandardSongReading,
  type StandardSongLookupItem,
} from './standardSongLookup.ts'

const createSong = (overrides: Partial<StandardSongLookupItem> = {}): StandardSongLookupItem => ({
  title: 'Grievous Lady',
  artist: 'Team Grimoire vs Laur',
  bpm: 231,
  reading: 'グリーヴァスレディ',
  ...overrides,
})

test('同じ曲名・アーティスト名のSTANDARD楽曲からBPMを取得できること', () => {
  // Given
  const songs = [createSong(), createSong({ title: 'Other', artist: 'Other', bpm: 180 })]

  // When
  const result = findStandardSongBpm(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'found', value: 231 })
})

test('前後の空白を除いて曲名・アーティスト名を照合すること', () => {
  // Given
  const songs = [createSong({ title: '  Song  ', artist: ' Artist ', bpm: 160 })]

  // When
  const result = findStandardSongBpm(songs, 'Song', 'Artist')

  // Then
  assert.deepEqual(result, { status: 'found', value: 160 })
})

test('削除済みのSTANDARD楽曲は照合対象外であること', () => {
  // Given
  const songs = [createSong({ is_deleted: true, bpm: 200 })]

  // When
  const result = findStandardSongBpm(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'notFound' })
})

test('一致するSTANDARD楽曲のBPMが未設定ならvalueMissingになること', () => {
  // Given
  const songs = [createSong({ bpm: null })]

  // When
  const result = findStandardSongBpm(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'valueMissing' })
})

test('一致するSTANDARD楽曲がなければnotFoundになること', () => {
  // Given
  const songs = [createSong()]

  // When
  const result = findStandardSongBpm(songs, '別の曲', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'notFound' })
})

test('曲名またはアーティスト名が空ならnotFoundになること', () => {
  // Given
  const songs = [createSong()]

  // When
  const emptyTitle = findStandardSongBpm(songs, '   ', 'Team Grimoire vs Laur')
  const emptyArtist = findStandardSongBpm(songs, 'Grievous Lady', '')

  // Then
  assert.deepEqual(emptyTitle, { status: 'notFound' })
  assert.deepEqual(emptyArtist, { status: 'notFound' })
})

test('複数件一致する場合はBPMが設定されている最初の1件を使うこと', () => {
  // Given
  const songs = [
    createSong({ bpm: null }),
    createSong({ is_deleted: true, bpm: 999 }),
    createSong({ bpm: 180 }),
    createSong({ bpm: 200 }),
  ]

  // When
  const result = findStandardSongBpm(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'found', value: 180 })
})

test('同じ曲名・アーティスト名のSTANDARD楽曲から読みを取得できること', () => {
  // Given
  const songs = [createSong(), createSong({ title: 'Other', artist: 'Other', reading: 'そのた' })]

  // When
  const result = findStandardSongReading(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'found', value: 'グリーヴァスレディ' })
})

test('読みの前後空白を除いて取得すること', () => {
  // Given
  const songs = [createSong({ reading: '  グリーヴァスレディ  ' })]

  // When
  const result = findStandardSongReading(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'found', value: 'グリーヴァスレディ' })
})

test('一致するSTANDARD楽曲の読みが未設定ならvalueMissingになること', () => {
  // Given
  const songs = [createSong({ reading: null }), createSong({ reading: '   ' })]

  // When
  const result = findStandardSongReading(songs, 'Grievous Lady', 'Team Grimoire vs Laur')

  // Then
  assert.deepEqual(result, { status: 'valueMissing' })
})
