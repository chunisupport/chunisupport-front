import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataRecordChange, PlayerDataSongRecordChange } from '../../types/api'
import {
  createRegisterScoreChangeKey,
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
