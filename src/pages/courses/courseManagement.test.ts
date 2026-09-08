import assert from 'node:assert/strict'
import test from 'node:test'
import type { ManagedCourseDTO } from '../../types/api.ts'
import {
  filterManagedCourses,
  isManagedCourseDeleted,
  sortManagedCourses,
} from './courseManagement.ts'

const courses: ManagedCourseDTO[] = [
  {
    display_id: 'bbbbbbbbbbbbbbbb',
    idx: '50002',
    name: 'CLASS II COURSE',
    class: '2',
  },
  {
    display_id: 'aaaaaaaaaaaaaaaa',
    idx: '50010',
    name: 'INFINITY COURSE',
    class: 'inf',
    is_deleted: true,
  },
  {
    display_id: 'cccccccccccccccc',
    idx: '50001',
    name: 'CLASS I COURSE',
    class: '1',
    is_deleted: false,
  },
]

test('isManagedCourseDeletedは省略されたis_deletedを未削除として扱うこと', () => {
  // Given: omitempty により is_deleted が無いコースと明示されたコース。

  // When / Then
  assert.equal(isManagedCourseDeleted(courses[0]), false)
  assert.equal(isManagedCourseDeleted(courses[1]), true)
  assert.equal(isManagedCourseDeleted(courses[2]), false)
})

test('sortManagedCoursesはidxを数値として昇順に並べること', () => {
  // Given: idx が文字列として逆順のコース一覧。

  // When
  const sorted = sortManagedCourses(courses)

  // Then
  assert.deepEqual(
    sorted.map((course) => course.idx),
    ['50001', '50002', '50010']
  )
})

test('filterManagedCoursesはコース名・idx・display_idで絞り込むこと', () => {
  // Given: 複数フィールドにヒットする検索語。

  // When
  const byName = filterManagedCourses(courses, 'infinity')
  const byIdx = filterManagedCourses(courses, '50002')
  const byDisplayId = filterManagedCourses(courses, 'cccccccc')
  const unmatched = filterManagedCourses(courses, 'unknown')

  // Then
  assert.deepEqual(
    byName.map((course) => course.display_id),
    ['aaaaaaaaaaaaaaaa']
  )
  assert.deepEqual(
    byIdx.map((course) => course.display_id),
    ['bbbbbbbbbbbbbbbb']
  )
  assert.deepEqual(
    byDisplayId.map((course) => course.display_id),
    ['cccccccccccccccc']
  )
  assert.deepEqual(unmatched, [])
})
