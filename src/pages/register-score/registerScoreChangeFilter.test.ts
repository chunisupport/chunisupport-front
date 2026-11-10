import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataCourseRecordChange, PlayerDataSongRecordChange } from '../../types/api'
import { isLampOnlyRegisterScoreChange } from './registerScoreChangeFilter'

const songBefore = {
  score: 1_000_000,
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
} as const

const songChange: PlayerDataSongRecordChange = {
  record_type: 'standard',
  change_type: 'updated',
  idx: 'song-1',
  diff: 'MASTER',
  before: songBefore,
  after: {
    score: 1_000_000,
    clear_lamp: 'CLEAR',
    combo_lamp: 'FULL COMBO',
    full_chain: null,
  },
}

test('通常譜面のスコアが同じでランプだけが変化した更新を判定する', () => {
  // Given / When
  const result = isLampOnlyRegisterScoreChange(songChange)

  // Then
  assert.equal(result, true)
})

test("WORLD'S ENDのランプ比較では大文字と小文字を同じ値として扱う", () => {
  // Given
  const change: PlayerDataSongRecordChange = {
    ...songChange,
    record_type: 'worldsend',
    diff: 'WE',
    before: {
      ...songBefore,
      clear_lamp: 'clear',
      combo_lamp: null,
    },
    after: {
      ...songChange.after,
      clear_lamp: 'CLEAR',
      combo_lamp: null,
    },
  }

  // When
  const result = isLampOnlyRegisterScoreChange(change)

  // Then
  assert.equal(result, false)
})

test('スコアとランプが同時に変化した更新はランプのみと判定しない', () => {
  // Given
  const change: PlayerDataSongRecordChange = {
    ...songChange,
    after: {
      ...songChange.after,
      score: 1_000_100,
    },
  }

  // When
  const result = isLampOnlyRegisterScoreChange(change)

  // Then
  assert.equal(result, false)
})

test('新規レコードはスコアが同じでもランプのみと判定しない', () => {
  // Given
  const change: PlayerDataSongRecordChange = {
    ...songChange,
    change_type: 'new',
    before: null,
  }

  // When
  const result = isLampOnlyRegisterScoreChange(change)

  // Then
  assert.equal(result, false)
})

test('コースのスコアが同じでクリア状態だけが変化した更新を判定する', () => {
  // Given
  const change: PlayerDataCourseRecordChange = {
    record_type: 'course',
    change_type: 'updated',
    idx: 'course-1',
    course_class: 'CLASS I',
    before: {
      score: 3_000_000,
      is_clear: false,
      combo_lamp: null,
    },
    after: {
      score: 3_000_000,
      is_clear: true,
      combo_lamp: null,
    },
  }

  // When
  const result = isLampOnlyRegisterScoreChange(change)

  // Then
  assert.equal(result, true)
})

test('スコアもランプも変化していない差分はランプのみと判定しない', () => {
  // Given
  const change: PlayerDataSongRecordChange = {
    ...songChange,
    after: { ...songBefore },
  }

  // When
  const result = isLampOnlyRegisterScoreChange(change)

  // Then
  assert.equal(result, false)
})
