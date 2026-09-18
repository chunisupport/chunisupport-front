import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO, SongDTO } from '../types/api'
import type { OverPowerChartEntry, OverPowerSummaryRow } from '../usecases/overpower/types'
import {
  buildLockedSongCandidateRecordFilter,
  buildLockedSongDiscoveryCells,
  compareLockedSongObservation,
  hasCompleteLockedSongDiscoveryRecords,
  matchesLockedSongObservation,
  parseDisplayedHundredths,
} from './lockedSongDiscovery'
import { DEFAULT_FILTER } from './recordFilterDefaults'

const SUMMARY_ROW: OverPowerSummaryRow = {
  id: 'genre',
  label: 'POPS & ANIME',
  current: 90.009,
  max: 100,
  percent: 90.009,
  count: 1,
}

/**
 * 候補範囲テスト用のOP対象エントリを生成する。
 *
 * @param id - 楽曲ID。
 * @param title - 楽曲名。
 * @param genre - ジャンル名。
 * @returns VERSE収録のOP対象エントリ。
 */
const createEntry = (id: string, title: string, genre: string): OverPowerChartEntry => ({
  song: { id, title, genre } as SongDTO,
  difficulty: 'MASTER',
  chartConst: 14.5,
  maxOverPower: 87.5,
  level: '14+',
  versionName: 'VERSE',
  record: null,
})

test('小数第2位までの筐体表示値を整数へ変換する', () => {
  // Given, When
  const result = parseDisplayedHundredths(' 90.1 ', 'OP')

  // Then
  assert.deepEqual(result, { ok: true, scaledValue: 9_010 })
})

test('小数第3位と100を超えるOP%を拒否する', () => {
  // Given, When
  const tooPrecise = parseDisplayedHundredths('90.001', 'OP')
  const tooLarge = parseDisplayedHundredths('100.01', 'OP%', 100)

  // Then
  assert.equal(tooPrecise.ok, false)
  assert.equal(tooLarge.ok, false)
})

test('内部値が筐体の小数第2位切り捨て区間に入る場合に一致する', () => {
  // Given, When
  const matches = matchesLockedSongObservation(90_009, 100_000, 90_000, 9_000)

  // Then
  assert.equal(matches, true)
  assert.equal(matchesLockedSongObservation(90_010, 100_000, 90_000, 9_000), false)
})

test('OPとOP%が計算値と一致する分類を一致と判定する', () => {
  // Given, When
  const result = compareLockedSongObservation(SUMMARY_ROW, {
    overPower: '90.00',
    percent: '90.00',
  })

  // Then
  assert.equal(result.status, 'match')
})

test('OPまたはOP%が計算値と異なる分類を不一致と判定する', () => {
  // Given, When
  const result = compareLockedSongObservation(SUMMARY_ROW, {
    overPower: '80.00',
    percent: '90.00',
  })

  // Then
  assert.equal(result.status, 'mismatch')
})

test('OPだけ入力された分類も照合する', () => {
  // Given, When
  const result = compareLockedSongObservation(SUMMARY_ROW, {
    overPower: '90.00',
    percent: '',
  })

  // Then
  assert.equal(result.status, 'match')
})

test('OP%だけ入力された分類も照合する', () => {
  // Given, When
  const result = compareLockedSongObservation(SUMMARY_ROW, {
    overPower: '',
    percent: '80.00',
  })

  // Then
  assert.equal(result.status, 'mismatch')
})

test('不一致のジャンルとバージョンの交差にある曲を候補範囲へまとめる', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], ['POPS & ANIME'], ['VERSE'], 'MASTER')

  // Then
  assert.deepEqual(result, [
    {
      difficulty: 'MASTER',
      genre: 'POPS & ANIME',
      version: 'VERSE',
      songs: [{ id: 'song-1', title: 'Candidate' }],
    },
  ])
})

test('不一致でないバージョンに属する曲は候補範囲へ含めない', () => {
  // Given
  const entry = createEntry('song-1', 'Excluded', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], ['POPS & ANIME'], ['SUN'], 'MASTER')

  // Then
  assert.deepEqual(result, [])
})

test('ジャンルだけ入力されても候補範囲を生成する', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], ['POPS & ANIME'], [], 'MASTER')

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].version, 'VERSE')
})

test('ジャンルだけの絞り込みでは収録バージョン不明の曲も候補に残す', () => {
  // Given
  const entry = { ...createEntry('song-1', 'Candidate', 'POPS & ANIME'), versionName: null }

  // When
  const result = buildLockedSongDiscoveryCells([entry], ['POPS & ANIME'], [], 'MASTER')

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].version, '不明')
})

test('バージョンだけ入力されても候補範囲を生成する', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], [], ['VERSE'], 'MASTER')

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].genre, 'POPS & ANIME')
})

test('差異が未入力なら候補範囲を生成しない', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When, Then
  assert.deepEqual(buildLockedSongDiscoveryCells([entry], [], [], 'MASTER'), [])
})

test('同じ曲の複数譜面が同一セルに属しても曲数は重複しない', () => {
  // Given
  const master = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const duplicateMaster = { ...master }

  // When
  const result = buildLockedSongDiscoveryCells(
    [master, duplicateMaster],
    ['POPS & ANIME'],
    ['VERSE'],
    'MASTER'
  )

  // Then
  assert.equal(result[0].songs.length, 1)
})

test('指定した難易度の候補だけを抽出する', () => {
  // Given
  const master = createEntry('song-master', 'Master', 'POPS & ANIME')
  const ultima = {
    ...createEntry('song-ultima', 'Ultima', 'POPS & ANIME'),
    difficulty: 'ULTIMA' as const,
  }

  // When
  const result = buildLockedSongDiscoveryCells(
    [master, ultima],
    ['POPS & ANIME'],
    ['VERSE'],
    'ULTIMA'
  )

  // Then
  assert.deepEqual(result[0].songs, [{ id: 'song-ultima', title: 'Ultima' }])
  assert.equal(result[0].difficulty, 'ULTIMA')
})

test('候補範囲をジャンルとバージョンで絞り込んだレコードフィルターへ変換する', () => {
  // Given
  const candidate = {
    difficulty: 'ULTIMA' as const,
    genre: 'POPS & ANIME',
    version: 'VERSE',
  }

  // When
  const result = buildLockedSongCandidateRecordFilter(DEFAULT_FILTER, candidate)

  // Then
  assert.deepEqual(result.genres, ['POPS & ANIME'])
  assert.deepEqual(result.versions, ['VERSE'])
  assert.deepEqual(result.difficulties, ['ULTIMA'])
  assert.equal(result.excludeLockedSongs, false)
})

test('楽曲マスタの全譜面にレコードがあれば完全と判定する', () => {
  // Given
  const song = {
    id: 'song',
    charts: { EXPERT: {}, MASTER: {} },
  } as SongDTO
  const records = [
    { id: 'song', difficulty: 'EXPERT' },
    { id: 'song', difficulty: 'MASTER' },
  ] as PlayerRecordDTO[]

  // When, Then
  assert.equal(hasCompleteLockedSongDiscoveryRecords([song], records), true)
  assert.equal(hasCompleteLockedSongDiscoveryRecords([song], records.slice(0, 1)), false)
})
