import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerLockedSongResponseItem } from '../../types/api.ts'
import { buildLockedSongsBatchPayload, createLockedSongKey } from './lockedSongsBatch.ts'

const createItem = (displayId: string, isUltima = false): PlayerLockedSongResponseItem => ({
  display_id: displayId,
  title: displayId,
  is_ultima: isUltima,
})

test('未解禁曲差分: 追加だけを正しく生成する', () => {
  const base = [createItem('a', false)]
  const edited = [
    { display_id: 'a', is_ultima: false },
    { display_id: 'b', is_ultima: true },
  ]

  const result = buildLockedSongsBatchPayload(base, edited)

  assert.deepEqual(result, {
    add: [{ display_id: 'b', is_ultima: true }],
  })
})

test('未解禁曲差分: 削除だけを正しく生成する', () => {
  const base = [createItem('a', false), createItem('b', true)]
  const edited = [{ display_id: 'a', is_ultima: false }]

  const result = buildLockedSongsBatchPayload(base, edited)

  assert.deepEqual(result, {
    delete: [{ display_id: 'b', is_ultima: true }],
  })
})

test('未解禁曲差分: add/deleteの同時差分を生成する', () => {
  const base = [createItem('a', false), createItem('b', true)]
  const edited = [
    { display_id: 'a', is_ultima: false },
    { display_id: 'c', is_ultima: false },
  ]

  const result = buildLockedSongsBatchPayload(base, edited)

  assert.deepEqual(result, {
    add: [{ display_id: 'c', is_ultima: false }],
    delete: [{ display_id: 'b', is_ultima: true }],
  })
})

test('未解禁曲差分: 差分なしは空payloadを返す', () => {
  const base = [createItem('a', false), createItem('b', true)]
  const edited = [
    { display_id: 'a', is_ultima: false },
    { display_id: 'b', is_ultima: true },
  ]

  const result = buildLockedSongsBatchPayload(base, edited)

  assert.deepEqual(result, {})
})

test('createLockedSongKey は通常とULTIMAで異なるキーを返す', () => {
  assert.equal(createLockedSongKey('song', false), 'song:normal')
  assert.equal(createLockedSongKey('song', true), 'song:ultima')
})
