import assert from 'node:assert/strict'
import test from 'node:test'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
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
  song: { id, title, genre, name_folder_code: 'C', op_target_difficulty: 'MASTER' } as SongDTO,
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
  const result = buildLockedSongDiscoveryCells([entry], {
    genres: ['POPS & ANIME'],
    versions: ['VERSE'],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.deepEqual(result, [
    {
      genre: 'POPS & ANIME',
      version: 'VERSE',
      nameFolder: null,
      level: null,
      songs: [{ id: 'song-1', title: 'Candidate' }],
    },
  ])
})

test('不一致でないバージョンに属する曲は候補範囲へ含めない', () => {
  // Given
  const entry = createEntry('song-1', 'Excluded', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], {
    genres: ['POPS & ANIME'],
    versions: ['SUN'],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.deepEqual(result, [])
})

test('ジャンルだけ入力されても候補範囲を生成する', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], {
    genres: ['POPS & ANIME'],
    versions: [],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].version, 'VERSE')
})

test('ジャンルだけの絞り込みでは収録バージョン不明の曲も候補に残す', () => {
  // Given
  const entry = { ...createEntry('song-1', 'Candidate', 'POPS & ANIME'), versionName: null }

  // When
  const result = buildLockedSongDiscoveryCells([entry], {
    genres: ['POPS & ANIME'],
    versions: [],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].version, '不明')
})

test('バージョンだけ入力されても候補範囲を生成する', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When
  const result = buildLockedSongDiscoveryCells([entry], {
    genres: [],
    versions: ['VERSE'],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.equal(result.length, 1)
  assert.equal(result[0].genre, 'POPS & ANIME')
})

test('差異が未入力なら候補範囲を生成しない', () => {
  // Given
  const entry = createEntry('song-1', 'Candidate', 'POPS & ANIME')

  // When, Then
  assert.deepEqual(
    buildLockedSongDiscoveryCells([entry], {
      genres: [],
      versions: [],
      nameFolders: [],
      levels: [],
    }),
    []
  )
})

test('同じ曲の複数譜面が同一セルに属しても曲数は重複しない', () => {
  // Given
  const master = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const duplicateMaster = { ...master }

  // When
  const result = buildLockedSongDiscoveryCells([master, duplicateMaster], {
    genres: ['POPS & ANIME'],
    versions: ['VERSE'],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.equal(result[0].songs.length, 1)
})

test('楽曲名順に差異があれば楽曲名順フォルダで候補範囲を絞り込んで分ける', () => {
  // Given
  const matched = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const excluded = {
    ...createEntry('song-2', 'Excluded', 'POPS & ANIME'),
    song: {
      id: 'song-2',
      title: 'Excluded',
      genre: 'POPS & ANIME',
      name_folder_code: 'D',
      op_target_difficulty: 'MASTER',
    } as SongDTO,
  }

  // When
  const result = buildLockedSongDiscoveryCells([matched, excluded], {
    genres: [],
    versions: [],
    nameFolders: ['C'],
    levels: [],
  })

  // Then
  assert.deepEqual(result, [
    {
      genre: 'POPS & ANIME',
      version: 'VERSE',
      nameFolder: 'C',
      level: null,
      songs: [{ id: 'song-1', title: 'Candidate' }],
    },
  ])
})

test('レベルに差異があれば譜面のレベルで候補範囲を絞り込んで分ける', () => {
  // Given
  const matched = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const excluded = { ...createEntry('song-2', 'Excluded', 'POPS & ANIME'), level: '14' as const }

  // When
  const result = buildLockedSongDiscoveryCells([matched, excluded], {
    genres: [],
    versions: [],
    nameFolders: [],
    levels: ['14+'],
  })

  // Then
  assert.deepEqual(result, [
    {
      genre: 'POPS & ANIME',
      version: 'VERSE',
      nameFolder: null,
      level: '14+',
      songs: [{ id: 'song-1', title: 'Candidate' }],
    },
  ])
})

test('レベルを含む差異をOP対象外の譜面も表示するレコードフィルターへまとめる', () => {
  // Given
  const mismatches = {
    genres: ['POPS & ANIME', 'VARIETY'],
    versions: ['VERSE'],
    nameFolders: ['C'],
    levels: ['13', '14+'] as const,
  }

  // When
  const result = buildLockedSongCandidateRecordFilter(DEFAULT_FILTER, mismatches)

  // Then
  assert.deepEqual(result.genres, ['POPS & ANIME', 'VARIETY'])
  assert.deepEqual(result.versions, ['VERSE'])
  assert.deepEqual(result.nameFolders, ['C'])
  assert.deepEqual(result.levelSet, ['13', '14+'])
  assert.deepEqual(result.const, DEFAULT_FILTER.const)
  assert.equal(result.opTargetOnly, false)
  assert.equal(result.opTargetType, 'theoretical')
  assert.deepEqual(result.difficulties, [...PLAYER_DATA_DIFFICULTIES])
  assert.equal(result.excludeLockedSongs, false)
})

test('差異がない分類軸は既定フィルターのまま絞り込まない', () => {
  // Given
  const defaultFilter = { ...DEFAULT_FILTER, genres: ['POPS & ANIME', 'VARIETY'] }
  const mismatches = { genres: [], versions: ['VERSE'], nameFolders: [], levels: [] }

  // When
  const result = buildLockedSongCandidateRecordFilter(defaultFilter, mismatches)

  // Then
  assert.deepEqual(result.genres, ['POPS & ANIME', 'VARIETY'])
  assert.equal(result.opTargetOnly, true)
  assert.equal(result.opTargetType, 'theoretical')
  assert.equal(result.nameFolders, null)
  assert.equal('levelSet' in result, false)
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

test('レベルの差異から現在・理論値ともOP対象外の譜面を候補に含め、他分類と交差させる', () => {
  // Given
  const master = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const expert: OverPowerChartEntry = { ...master, difficulty: 'EXPERT', level: '13', record: null }
  const excluded = createEntry('song-2', 'Excluded', 'VARIETY')

  // When
  const cells = buildLockedSongDiscoveryCells([master, expert, { ...expert }, excluded], {
    genres: ['POPS & ANIME'],
    versions: ['VERSE'],
    nameFolders: ['C'],
    levels: ['13'],
  })

  // Then
  assert.equal(cells.length, 1)
  assert.equal(cells[0].level, '13')
  assert.deepEqual(cells[0].songs, [{ id: 'song-1', title: 'Candidate' }])
})

test('レベルに差異がなければ候補は理論値OP対象譜面に限定する', () => {
  // Given
  const master = createEntry('song-1', 'Candidate', 'POPS & ANIME')
  const expert: OverPowerChartEntry = { ...master, difficulty: 'EXPERT', level: '13' }
  const nonTargetOnly: OverPowerChartEntry = {
    ...createEntry('song-2', 'Excluded', 'POPS & ANIME'),
    difficulty: 'EXPERT',
  }

  // When
  const cells = buildLockedSongDiscoveryCells([master, expert, nonTargetOnly], {
    genres: ['POPS & ANIME'],
    versions: [],
    nameFolders: [],
    levels: [],
  })

  // Then
  assert.deepEqual(cells[0].songs, [{ id: 'song-1', title: 'Candidate' }])
})
