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

test('createRecordTitleMatcher は末尾の全角英字を除去して一致判定できる', () => {
  const record = createRecord({ title: 'かもねぎ' })
  const matcher = createRecordTitleMatcher('かもｎ')

  assert.equal(matcher(record), true)
})

test('isRecordMatched は難易度・ジャンル・バージョンの条件を判定できる', () => {
  const record = createRecord({
    difficulty: 'EXPERT',
    genre: 'niconico',
    release_version: 'LUMINOUS',
  })
  const matchedFilters = {
    ...getDefaultFilter(),
    difficulties: ['EXPERT'],
    genres: ['niconico'],
    versions: ['LUMINOUS'],
  }

  assert.equal(isRecordMatched(record, matchedFilters), true)
  assert.equal(isRecordMatched(record, { ...matchedFilters, difficulties: ['MASTER'] }), false)
  assert.equal(isRecordMatched(record, { ...matchedFilters, genres: ['VARIETY'] }), false)
  assert.equal(isRecordMatched(record, { ...matchedFilters, versions: ['VERSE'] }), false)
})

test('isRecordMatched は譜面定数とスコアの範囲を判定できる', () => {
  const record = createRecord({ const: 14.7, score: 1007500 })
  const matchedFilters = {
    ...getDefaultFilter(),
    constMin: 14.6,
    constMax: 14.8,
    scoreMin: 1007000,
    scoreMax: 1008000,
  }

  assert.equal(isRecordMatched(record, matchedFilters), true)
  assert.equal(isRecordMatched(record, { ...matchedFilters, constMin: 14.8 }), false)
  assert.equal(isRecordMatched(record, { ...matchedFilters, constMax: 14.6 }), false)
  assert.equal(isRecordMatched(record, { ...matchedFilters, scoreMin: 1008000 }), false)
  assert.equal(isRecordMatched(record, { ...matchedFilters, scoreMax: 1007000 }), false)
})

test('isRecordMatched はランプ条件を判定できる', () => {
  const record = createRecord({
    combo_lamp: 'FULL COMBO',
    full_chain: 'FULL CHAIN GOLD',
    clear_lamp: 'HARD',
  })
  const matchedFilters = {
    ...getDefaultFilter(),
    combo_lamp: ['FULL COMBO'],
    chain_lamp: ['FULL CHAIN GOLD'],
    hard_lamp: ['HARD'],
  }

  assert.equal(isRecordMatched(record, matchedFilters), true)
  assert.equal(isRecordMatched(record, { ...matchedFilters, combo_lamp: ['ALL JUSTICE'] }), false)
  assert.equal(
    isRecordMatched(record, { ...matchedFilters, chain_lamp: ['FULL CHAIN PLATINUM'] }),
    false
  )
  assert.equal(isRecordMatched(record, { ...matchedFilters, hard_lamp: ['CLEAR'] }), false)
})

test('isRecordMatched は未プレイ除外と未プレイのスコア0扱いを判定できる', () => {
  const record = createRecord({
    is_played: false,
    score: 0,
    combo_lamp: null,
    full_chain: null,
    clear_lamp: null,
  })

  assert.equal(isRecordMatched(record, { ...getDefaultFilter(), excludeNoPlay: true }), false)
  assert.equal(
    isRecordMatched(record, {
      ...getDefaultFilter(),
      scoreMin: 0,
      scoreMax: 0,
      combo_lamp: [null],
      chain_lamp: [null],
      hard_lamp: [null],
    }),
    true
  )
  assert.equal(isRecordMatched(record, { ...getDefaultFilter(), scoreMin: 1 }), false)
})
