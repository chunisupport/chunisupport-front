import assert from 'node:assert/strict'
import test from 'node:test'
import type { CourseDTO } from '../types/api.ts'
import { mergeCourseRecords, newerCourseUpdatedAt } from './courseRecordMerger.ts'

const courses: CourseDTO[] = [
  { display_id: 'course-1', idx: '50001', name: 'COURSE 1', class: '1' },
  { display_id: 'course-2', idx: '50002', name: 'COURSE 2', class: '2' },
]

test('コースマスタへプレイ済みレコードを結合し、未プレイを補完すること', () => {
  // Given: 有効なコース2件と、片方だけのプレイ済みレコード。
  const records = [
    {
      display_id: 'course-1',
      score: 3_020_000,
      is_clear: true,
      combo_lamp: 'FULL COMBO' as const,
      updated_at: '2026-07-15T10:00:00Z',
    },
  ]

  // When: マスタとレコードを結合する。
  const result = mergeCourseRecords(courses, records, '2026-07-15T10:00:00Z')

  // Then: プレイ済み状態を保持し、レコードがないコースを未プレイとして補完する。
  assert.deepEqual(result, {
    courses: [
      {
        ...courses[0],
        is_played: true,
        score: 3_020_000,
        is_clear: true,
        combo_lamp: 'FULL COMBO',
        updated_at: '2026-07-15T10:00:00Z',
      },
      {
        ...courses[1],
        is_played: false,
        score: 0,
        is_clear: false,
        combo_lamp: null,
        updated_at: null,
      },
    ],
    meta: { updated_at: '2026-07-15T10:00:00Z' },
  })
})

test('有効なマスタから削除されたコースレコードは表示結果へ含めないこと', () => {
  // Given: 現行マスタに存在しない古いレコード。
  const records = [
    {
      display_id: 'deleted-course',
      score: 3_000_000,
      is_clear: true,
      combo_lamp: null,
      updated_at: '2026-07-14T10:00:00Z',
    },
  ]

  // When: 現行マスタと結合する。
  const result = mergeCourseRecords(courses, records, null)

  // Then: 現行マスタのコースだけが未プレイとして表示される。
  assert.deepEqual(
    result.courses.map((course) => course.display_id),
    ['course-1', 'course-2']
  )
  assert.ok(result.courses.every((course) => !course.is_played))
})

test('マスタとレコードの更新日時から新しい方を選ぶこと', () => {
  // Given: マスタより新しいレコード更新日時。
  const masterUpdatedAt = '2026-07-14T10:00:00Z'
  const recordUpdatedAt = '2026-07-15T10:00:00+09:00'

  // When: 更新日時を比較する。
  const result = newerCourseUpdatedAt(masterUpdatedAt, recordUpdatedAt)

  // Then: タイムゾーンを考慮した新しい日時を返す。
  assert.equal(result, recordUpdatedAt)
})
