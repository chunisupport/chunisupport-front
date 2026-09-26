import assert from 'node:assert/strict'
import test from 'node:test'
import { sortByReleaseDateDescWithMissingFirst } from './releaseDateSorting.ts'

type TestSong = {
  id: string
  release?: string | null
}

const createSong = (id: string, release?: string | null): TestSong => ({
  id,
  release,
})

test('sortByReleaseDateDescWithMissingFirst: リリース日がない楽曲を先頭にし、リリース日の降順に並べる', () => {
  // Given
  const songs = [
    createSong('older', '2026-01-01'),
    createSong('missing', null),
    createSong('newer', '2026-02-01T00:00:00Z'),
    createSong('undefined'),
  ]

  // When
  const result = sortByReleaseDateDescWithMissingFirst(songs)

  // Then
  assert.deepEqual(
    result.map((song) => song.id),
    ['missing', 'undefined', 'newer', 'older']
  )
})

test('sortByReleaseDateDescWithMissingFirst: 元配列を変更しない', () => {
  // Given
  const songs = [createSong('older', '2026-01-01'), createSong('newer', '2026-02-01')]

  // When
  const result = sortByReleaseDateDescWithMissingFirst(songs)

  // Then
  assert.notEqual(result, songs)
  assert.deepEqual(
    songs.map((song) => song.id),
    ['older', 'newer']
  )
})
