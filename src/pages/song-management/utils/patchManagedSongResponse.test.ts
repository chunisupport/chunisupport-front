import assert from 'node:assert/strict'
import test from 'node:test'
import { patchManagedSongResponse } from './patchManagedSongResponse'

test('指定IDの要素だけを更新し、他の要素の参照は維持すること', () => {
  // Given
  const first = { id: 'a', title: 'First' }
  const second = { id: 'b', title: 'Second' }
  const current = { songs: [first, second] }

  // When
  const result = patchManagedSongResponse(current, 'b', (song) => ({
    ...song,
    title: 'Updated',
  }))

  // Then
  assert.ok(result)
  assert.equal(result.songs[0], first)
  assert.notEqual(result.songs[1], second)
  assert.equal(result.songs[1]?.title, 'Updated')
})

test('current が undefined の場合は undefined を返すこと', () => {
  // Given
  const current = undefined

  // When
  const result = patchManagedSongResponse(current, 'a', (song) => song)

  // Then
  assert.equal(result, undefined)
})
