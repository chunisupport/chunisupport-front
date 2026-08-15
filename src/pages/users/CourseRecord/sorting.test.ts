import assert from 'node:assert/strict'
import test from 'node:test'
import type { CourseRecordDTO } from '../../../types/api'
import { DEFAULT_COURSE_RECORD_SORT_CONDITION, sortCourseRecords } from './sorting.ts'

/**
 * テスト用コースレコードを生成する。
 *
 * @param overrides - 既定値から上書きするフィールド。
 * @returns 必須項目を持つコースレコード。
 */
const createCourseRecord = (overrides: Partial<CourseRecordDTO> = {}): CourseRecordDTO => ({
  display_id: '0123456789abcdef',
  idx: '50001',
  name: 'コースA',
  class: '1',
  is_played: true,
  score: 3_000_000,
  is_clear: true,
  combo_lamp: null,
  updated_at: '2026-07-14T00:00:00Z',
  ...overrides,
})

test('コースレコードの既定ソートはクラス昇順であること', () => {
  // Given: コースレコード表の既定ソート条件。
  const defaultSortCondition = DEFAULT_COURSE_RECORD_SORT_CONDITION

  // When: ソートキーと方向を参照する。
  const result = {
    key: defaultSortCondition.key,
    direction: defaultSortCondition.direction,
  }

  // Then: クラス昇順になっている。
  assert.deepEqual(result, { key: 'courseClass', direction: 'asc' })
})

test('コーススコアの昇降順でも未プレイを末尾へ固定すること', () => {
  // Given: プレイ済み2件と未プレイ1件。
  const records = [
    createCourseRecord({ idx: 'low', score: 2_900_000 }),
    createCourseRecord({ idx: 'unplayed', is_played: false, score: 0 }),
    createCourseRecord({ idx: 'high', score: 3_020_000 }),
  ]

  // When: スコアの昇順と降順で並べ替える。
  const ascending = sortCourseRecords(records, { key: 'score', direction: 'asc' })
  const descending = sortCourseRecords(records, { key: 'score', direction: 'desc' })

  // Then: どちらも未プレイは末尾になる。
  assert.deepEqual(
    ascending.map((record) => record.idx),
    ['low', 'high', 'unplayed']
  )
  assert.deepEqual(
    descending.map((record) => record.idx),
    ['high', 'low', 'unplayed']
  )
})

test('コースのコンボランプをAJC、AJ、FCの順序で並べ替えること', () => {
  // Given: 3曲分の理論値を含むコンボランプと未プレイのコース。
  const records = [
    createCourseRecord({ idx: 'aj', combo_lamp: 'ALL JUSTICE', score: 3_029_999 }),
    createCourseRecord({ idx: 'unplayed', is_played: false, combo_lamp: null, score: 0 }),
    createCourseRecord({ idx: 'fc', combo_lamp: 'FULL COMBO', score: 3_025_000 }),
    createCourseRecord({ idx: 'ajc', combo_lamp: 'ALL JUSTICE', score: 3_030_000 }),
  ]

  // When: AJ列を降順で並べ替える。
  const result = sortCourseRecords(records, { key: 'lamp', direction: 'desc' })

  // Then: 3倍スコアでAJCを判定し、未プレイは末尾にする。
  assert.deepEqual(
    result.map((record) => record.idx),
    ['ajc', 'aj', 'fc', 'unplayed']
  )
})

test('コースクラスを定義済みのクラス順で並べ替えること', () => {
  // Given: 表示順とは異なる並びのコースクラス。
  const records = [
    createCourseRecord({ idx: 'extra', class: 'extra' }),
    createCourseRecord({ idx: 'inf', class: 'inf' }),
    createCourseRecord({ idx: 'one', class: '1' }),
  ]

  // When: クラス昇順で並べ替える。
  const result = sortCourseRecords(records, { key: 'courseClass', direction: 'asc' })

  // Then: Ⅰ、∞、EXの順になる。
  assert.deepEqual(
    result.map((record) => record.idx),
    ['one', 'inf', 'extra']
  )
})

test('更新日ソートは未プレイと無効日付を末尾に固定すること', () => {
  // Given: 更新日が異なるプレイ済みレコードと、更新日を表示できないレコード。
  const records = [
    createCourseRecord({ idx: 'older', updated_at: '2026-07-13T00:00:00Z' }),
    createCourseRecord({ idx: 'invalid', updated_at: 'invalid-date' }),
    createCourseRecord({ idx: 'newer', updated_at: '2026-07-14T00:00:00Z' }),
    createCourseRecord({ idx: 'unplayed', is_played: false, updated_at: null }),
  ]

  // When: 更新日の昇順と降順で並べ替える。
  const ascending = sortCourseRecords(records, { key: 'updatedAt', direction: 'asc' })
  const descending = sortCourseRecords(records, { key: 'updatedAt', direction: 'desc' })

  // Then: 有効な更新日だけ方向を反映し、表示できないレコードは末尾に固定する。
  assert.deepEqual(
    ascending.map((record) => record.idx),
    ['older', 'newer', 'invalid', 'unplayed']
  )
  assert.deepEqual(
    descending.map((record) => record.idx),
    ['newer', 'older', 'invalid', 'unplayed']
  )
})
