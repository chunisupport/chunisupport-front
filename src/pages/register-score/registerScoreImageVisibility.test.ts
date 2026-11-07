import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataRecordChange, PlayerDataSongRecordChange } from '../../types/api'
import {
  createRegisterScoreChangeKey,
  hasRegisterScoreImageChanges,
  isRegisterScoreImageSectionExcluded,
  updateRegisterScoreExcludedChangeKeys,
} from './registerScoreImageVisibility'

/**
 * テスト用の楽曲差分を生成する。
 *
 * @param idx - 差分を識別する楽曲ID。
 * @returns 指定した楽曲IDを持つテスト用差分。
 */
const createChange = (idx: string): PlayerDataSongRecordChange => ({
  record_type: 'standard',
  change_type: 'updated',
  idx,
  diff: 'MASTER',
  before: null,
  after: {
    score: 1_000_000,
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
  },
})

/**
 * テスト用差分から画像除外判定に使うキーを返す。
 *
 * @param change - キーへ変換する更新差分。
 * @returns 差分の楽曲またはコースID。
 */
const resolveChangeKey = (change: PlayerDataRecordChange): string => change.idx

test('セクション内に画像へ含めるカードが残っていればtrueを返す', () => {
  // Given: 2枚のカードのうち1枚だけを画像から除外している。
  const changes = [createChange('song-1'), createChange('song-2')]
  const excludedChangeKeys = new Set(['song-1'])

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, excludedChangeKeys, resolveChangeKey)

  // Then: 画像へ含めるカードが残っていると判定する。
  assert.equal(result, true)
})

test('セクション内のすべてのカードを画像から除外していればfalseを返す', () => {
  // Given: セクション内のすべてのカードを画像から除外している。
  const changes = [createChange('song-1'), createChange('song-2')]
  const excludedChangeKeys = new Set(['song-1', 'song-2'])

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, excludedChangeKeys, resolveChangeKey)

  // Then: 画像へ含めるカードは残っていないと判定する。
  assert.equal(result, false)
})

test('空のセクションには画像へ含めるカードがないと判定する', () => {
  // Given: セクションにカードがない。
  const changes: PlayerDataSongRecordChange[] = []

  // When: 画像へ含めるカードの有無を判定する。
  const result = hasRegisterScoreImageChanges(changes, new Set(), resolveChangeKey)

  // Then: 画像へ含めるカードはないと判定する。
  assert.equal(result, false)
})

test('同じ楽曲でも難易度が異なる差分と、同じIDのコース差分を別のキーにする', () => {
  // Given: 同じIDを持つMASTER・EXPERTの楽曲差分とコース差分。
  const master = createChange('100')
  const expert: PlayerDataSongRecordChange = { ...master, diff: 'EXPERT' }
  const course: PlayerDataRecordChange = {
    record_type: 'course',
    change_type: 'updated',
    idx: '100',
    course_class: 'inf',
    before: null,
    after: { score: 3_000_000, is_clear: true, combo_lamp: null },
  }

  // When
  const keys = [master, expert, course].map(createRegisterScoreChangeKey)

  // Then: 種別・ID・難易度またはクラスで区別される。
  assert.deepEqual(keys, ['standard:100:MASTER', 'standard:100:EXPERT', 'course:100:inf'])
})

test('セクション内のカードをすべて除外した場合だけセクションを画像から除外する', () => {
  // Given: 2枚のカードを持つセクション。
  const changes = [createChange('song-1'), createChange('song-2')]
  const keys = changes.map(createRegisterScoreChangeKey)

  // When: 1枚だけ除外した場合と、すべて除外した場合を判定する。
  const partial = isRegisterScoreImageSectionExcluded(changes, new Set([keys[0]]))
  const all = isRegisterScoreImageSectionExcluded(changes, new Set(keys))

  // Then: すべて除外した場合だけtrueになる。
  assert.equal(partial, false)
  assert.equal(all, true)
})

test('カードのない空セクションは空状態の表示を残すため画像から除外しない', () => {
  // Given / When
  const result = isRegisterScoreImageSectionExcluded([], new Set(['standard:song-1:MASTER']))

  // Then
  assert.equal(result, false)
})

test('画像除外キーは元の集合を変更せずに追加・削除する', () => {
  // Given: 1件を除外済みの集合。
  const current: ReadonlySet<string> = new Set(['song-1'])

  // When: 別のキーを追加し、既存キーを削除する。
  const added = updateRegisterScoreExcludedChangeKeys(current, 'song-2', true)
  const removed = updateRegisterScoreExcludedChangeKeys(current, 'song-1', false)

  // Then: 新しい集合だけが更新され、元の集合は変わらない。
  assert.deepEqual([...added], ['song-1', 'song-2'])
  assert.deepEqual([...removed], [])
  assert.deepEqual([...current], ['song-1'])
})
