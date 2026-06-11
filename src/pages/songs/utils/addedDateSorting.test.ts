import assert from 'node:assert/strict'
import test from 'node:test'
import { sortByAddedDateDescWithMissingFirst } from './addedDateSorting.ts'

type TestSong = {
  id: string
  created_at?: string | null
}

const createSong = (id: string, createdAt?: string | null): TestSong => ({
  id,
  created_at: createdAt,
})

test('sortByAddedDateDescWithMissingFirst: 追加日がない楽曲を先頭にし、追加日の降順に並べる', () => {
  // Given
  const songs = [
    createSong('older', '2026-01-01T00:00:00Z'),
    createSong('missing', null),
    createSong('newer', '2026-02-01T00:00:00Z'),
    createSong('undefined'),
  ]

  // When
  const result = sortByAddedDateDescWithMissingFirst(songs)

  // Then
  assert.deepEqual(
    result.map((song) => song.id),
    ['missing', 'undefined', 'newer', 'older']
  )
})

test('sortByAddedDateDescWithMissingFirst: 元配列を変更しない', () => {
  // Given
  const songs = [
    createSong('older', '2026-01-01T00:00:00Z'),
    createSong('newer', '2026-02-01T00:00:00Z'),
  ]

  // When
  const result = sortByAddedDateDescWithMissingFirst(songs)

  // Then
  assert.notEqual(result, songs)
  assert.deepEqual(
    songs.map((song) => song.id),
    ['older', 'newer']
  )
})
