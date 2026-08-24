import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  CourseDTO,
  PlayerDataCourseRecordChange,
  PlayerDataSongRecordChange,
  SongDTO,
  WorldsendSongDTO,
} from '../../types/api'
import {
  resolveRegisterScoreChartLevel,
  resolveRegisterScoreCourseTitle,
  resolveRegisterScoreSongTitle,
} from './registerScoreResolvers'

/** テスト用の通常楽曲マスタを生成する */
const createStandardSong = (): SongDTO => ({
  id: 'song-id',
  title: '通常楽曲',
  reading: null,
  artist: 'アーティスト',
  genre: 'ジャンル',
  bpm: 180,
  release: null,
  official_idx: 'standard-idx',
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
  charts: { MASTER: { const: 15.4, is_const_unknown: false, notes: null } },
})

/** テスト用のWORLD'S END楽曲マスタを生成する */
const createWorldsendSong = (): WorldsendSongDTO => ({
  id: 'worldsend-id',
  title: "WORLD'S END楽曲",
  reading: null,
  artist: 'アーティスト',
  genre: null,
  bpm: null,
  release: null,
  official_idx: 'worldsend-idx',
  jacket: null,
  charts: { WORLDSEND: { attribute: null, level_star: 5, notes: null } },
})

const standardChange: PlayerDataSongRecordChange = {
  record_type: 'standard',
  change_type: 'new',
  idx: 'standard-idx',
  diff: 'MASTER',
  before: null,
  after: { score: 1_000_000, clear_lamp: null, combo_lamp: null, full_chain: null },
}

const worldsendChange: PlayerDataSongRecordChange = {
  ...standardChange,
  record_type: 'worldsend',
  idx: 'worldsend-idx',
  diff: 'WE',
}

const courseChange: PlayerDataCourseRecordChange = {
  record_type: 'course',
  change_type: 'new',
  idx: 'course-idx',
  course_class: 'I',
  before: null,
  after: { score: 1_000_000, is_clear: true, combo_lamp: null },
}

test("通常譜面とWORLD'S END譜面のタイトルを解決する", () => {
  // Given: 各種別に対応する楽曲マスタ。
  const standardSongs = [createStandardSong()]
  const worldsendSongs = [createWorldsendSong()]

  // When: 更新差分のタイトルを解決する。
  const standardTitle = resolveRegisterScoreSongTitle(standardChange, standardSongs, worldsendSongs)
  const worldsendTitle = resolveRegisterScoreSongTitle(
    worldsendChange,
    standardSongs,
    worldsendSongs
  )

  // Then: レコード種別に応じたマスタのタイトルを返す。
  assert.equal(standardTitle, '通常楽曲')
  assert.equal(worldsendTitle, "WORLD'S END楽曲")
})

test('コースと未登録楽曲はプレースホルダーのタイトルを返す', () => {
  // Given: 楽曲マスタが空の状態。
  const unknownStandardChange = { ...standardChange, idx: 'unknown' }

  // When: タイトルを解決する。
  const courseTitle = resolveRegisterScoreSongTitle(courseChange, [], [])
  const unknownTitle = resolveRegisterScoreSongTitle(unknownStandardChange, [], [])

  // Then: どちらもプレースホルダーを返す。
  assert.equal(courseTitle, '-')
  assert.equal(unknownTitle, '-')
})

test('レコード種別に応じて譜面レベルを解決する', () => {
  // Given: 通常譜面とWORLD\'S END譜面のマスタ。
  const standardSongs = [createStandardSong()]
  const worldsendSongs = [createWorldsendSong()]

  // When: 各種別の譜面レベルを解決する。
  const standardLevel = resolveRegisterScoreChartLevel(
    standardChange,
    standardSongs,
    worldsendSongs
  )
  const worldsendLevel = resolveRegisterScoreChartLevel(
    worldsendChange,
    standardSongs,
    worldsendSongs
  )
  const courseLevel = resolveRegisterScoreChartLevel(courseChange, standardSongs, worldsendSongs)

  // Then: 通常譜面はレベル表記、WORLD'S ENDは星表記、それ以外は未定義となる。
  assert.equal(standardLevel, '15')
  assert.equal(worldsendLevel, '★5')
  assert.equal(courseLevel, undefined)
})

test('コース名を解決し、未登録コースではプレースホルダーを返す', () => {
  // Given: 1件のコースマスタ。
  const courses: Pick<CourseDTO, 'idx' | 'name'>[] = [{ idx: 'course-idx', name: 'テストコース' }]

  // When: 登録済みと未登録のコース名を解決する。
  const resolvedTitle = resolveRegisterScoreCourseTitle(courseChange, courses)
  const unknownTitle = resolveRegisterScoreCourseTitle({ ...courseChange, idx: 'unknown' }, courses)

  // Then: マスタにある名前またはプレースホルダーを返す。
  assert.equal(resolvedTitle, 'テストコース')
  assert.equal(unknownTitle, '-')
})
