import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger.ts'
import {
  createRecordTitleMatcher,
  getDefaultFilter,
  isRecordMatched,
  isRecordMatchedWithTitleMatcher,
} from './filtering'

const createRecord = (
  overrides: Partial<PlayerRecordWithSongMeta> = {}
): PlayerRecordWithSongMeta => ({
  is_played: true,
  updated_at: '2026-04-20T00:00:00Z',
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'アルファ',
  reading: 'アルファ',
  artist: 'LeaF',
  const: 14.5,
  is_const_unknown: false,
  score: 1005000,
  rating: 16.5,
  overpower: 80,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  genre: 'POPS & ANIME',
  release: '2024-01-01',
  release_version: 'VERSE',
  ...overrides,
})

test('isRecordMatched はアーティスト名でも検索できる', () => {
  const record = createRecord({ artist: 'LeaF' })
  const filters = { ...getDefaultFilter(), title: 'leaf' }

  assert.equal(isRecordMatched(record, filters), true)
})

test('isRecordMatched は reading 正規化したクエリでも検索できる', () => {
  const record = createRecord({ reading: 'カッツ' })
  const filters = { ...getDefaultFilter(), title: 'ガッツ' }

  assert.equal(isRecordMatched(record, filters), true)
})

test('isRecordMatchedWithTitleMatcher は事前生成したマッチャーで一致判定できる', () => {
  const record = createRecord({ artist: 'LeaF', reading: 'カッツ' })
  const filters = { ...getDefaultFilter(), title: 'ｶﾞｯﾂ' }
  const matcher = createRecordTitleMatcher(filters.title)

  assert.equal(isRecordMatchedWithTitleMatcher(record, filters, matcher), true)
})
