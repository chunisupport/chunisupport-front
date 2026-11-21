import assert from 'node:assert/strict'
import test from 'node:test'
import type { ManagedCourseDTO } from '../../types/api.ts'
import {
  filterManagedCourses,
  hasCourseTracks,
  isManagedCourseDeleted,
  sortManagedCourses,
} from './courseManagement.ts'

const courses: ManagedCourseDTO[] = [
  {
    id: 'bbbbbbbbbbbbbbbb',
    idx: '50002',
    name: 'CLASS II COURSE',
    class: '2',
  },
  {
    id: 'aaaaaaaaaaaaaaaa',
    idx: '50010',
    name: 'INFINITY COURSE',
    class: 'inf',
    is_deleted: true,
  },
  {
    id: 'cccccccccccccccc',
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

test('sortManagedCoursesは桁数が異なるidxも文字列順ではなく数値順に並べること', () => {
  // Given: 文字列順なら10が2より前になる、数値降順の入力。
  const input: ManagedCourseDTO[] = [
    { id: 'ten', idx: '10', name: '十番', class: '1' },
    { id: 'two', idx: '2', name: '二番', class: '1' },
  ]

  // When
  const sorted = sortManagedCourses(input)

  // Then
  assert.deepEqual(
    sorted.map((course) => course.idx),
    ['2', '10']
  )
})

test('filterManagedCoursesはコース名・idx・idで絞り込むこと', () => {
  // Given: 複数フィールドにヒットする検索語。

  // When
  const byName = filterManagedCourses(courses, 'infinity')
  const byIdx = filterManagedCourses(courses, '50002')
  const byDisplayId = filterManagedCourses(courses, 'cccccccc')
  const unmatched = filterManagedCourses(courses, 'unknown')

  // Then
  assert.deepEqual(
    byName.map((course) => course.id),
    ['aaaaaaaaaaaaaaaa']
  )
  assert.deepEqual(
    byIdx.map((course) => course.id),
    ['bbbbbbbbbbbbbbbb']
  )
  assert.deepEqual(
    byDisplayId.map((course) => course.id),
    ['cccccccccccccccc']
  )
  assert.deepEqual(unmatched, [])
})

test('filterManagedCoursesはクラスと構成状態でも絞り込めること', () => {
  // Given: 構成登録済み・未登録・削除済みが混在するコース一覧
  const sample: ManagedCourseDTO[] = [
    {
      id: 'configured-1',
      idx: '1',
      name: '登録済みコース',
      class: '1',
      tracks: [
        { track_no: 1, selection_type: 'FIXED', charts: [{ id: 's1', difficulty: 'MASTER' }] },
      ],
    },
    {
      id: 'unconfigured-2',
      idx: '2',
      name: '未登録コース',
      class: '2',
    },
    {
      id: 'deleted-1',
      idx: '3',
      name: '削除済みコース',
      class: '1',
      is_deleted: true,
    },
  ]

  // When & Then
  assert.equal(hasCourseTracks(sample[0]), true)
  assert.equal(hasCourseTracks(sample[1]), false)
  assert.deepEqual(
    filterManagedCourses(sample, '', { courseClass: '1' }).map((c) => c.id),
    ['configured-1', 'deleted-1']
  )
  assert.deepEqual(
    filterManagedCourses(sample, '', { status: 'configured' }).map((c) => c.id),
    ['configured-1']
  )
  assert.deepEqual(
    filterManagedCourses(sample, '', { status: 'unconfigured' }).map((c) => c.id),
    ['unconfigured-2']
  )
  assert.deepEqual(
    filterManagedCourses(sample, '', { status: 'deleted' }).map((c) => c.id),
    ['deleted-1']
  )
})
