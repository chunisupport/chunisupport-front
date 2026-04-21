import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO } from '../../types/api'
import { resolveSongPersonalBest } from './resolveSongPersonalBest.ts'

const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  updated_at: '2026-04-21T00:00:00Z',
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'Test Song',
  artist: 'Tester',
  const: 15,
  is_const_unknown: false,
  score: 1005000,
  rating: 16,
  overpower: 90,
  img: '',
  clear_lamp: 'ABSOLUTE',
  combo_lamp: 'ALL JUSTICE',
  full_chain: null,
  slot: null,
  ...overrides,
})

test('指定楽曲・難易度に一致する自己ベストを返す', () => {
  const records = [
    createRecord({ id: 'song-2' }),
    createRecord({ id: 'song-1', difficulty: 'EXPERT' }),
    createRecord({ id: 'song-1', difficulty: 'MASTER', score: 1008765 }),
  ]

  const result = resolveSongPersonalBest(records, 'song-1', 'master')

  assert.equal(result?.score, 1008765)
  assert.equal(result?.difficulty, 'MASTER')
})

test('未プレイまたはスコア0のデータは返さない', () => {
  const records = [
    createRecord({ id: 'song-1', is_played: false, score: 1000000 }),
    createRecord({ id: 'song-1', score: 0 }),
  ]

  const result = resolveSongPersonalBest(records, 'song-1', 'master')

  assert.equal(result, undefined)
})

test('score が不正なレコードは除外し、画面クラッシュを防ぐ', () => {
  const malformedRecord = {
    ...createRecord({ id: 'song-1', difficulty: 'MASTER' }),
    score: undefined,
  } as unknown as PlayerRecordDTO

  const result = resolveSongPersonalBest([malformedRecord], 'song-1', 'master')

  assert.equal(result, undefined)
})

test('不正な難易度文字列の場合は undefined を返す', () => {
  const records = [createRecord({ id: 'song-1', difficulty: 'MASTER' })]

  const result = resolveSongPersonalBest(records, 'song-1', 'invalid')

  assert.equal(result, undefined)
})
