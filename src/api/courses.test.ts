import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して courses API 関数群を読み込む。
 * @returns courses API モジュール。
 */
const loadCoursesApi = () => loadTestModule((cacheKey) => import(`./courses.ts?cache=${cacheKey}`))

test('編集者向けコースAPIは一覧取得と追加・更新・削除・復元のパスを呼び出す', async () => {
  // Given: コース管理APIが成功する。
  const createdCourse = {
    id: 1,
    display_id: '0123456789abcdef',
    idx: '50020',
    name: 'CLASS I COURSE',
    class: '1',
    is_deleted: false,
    updated_at: '2026-07-14T10:00:00Z',
  }
  const calls = installFetchRecorder((input, init) => {
    if ((init?.method ?? 'GET') === 'GET') {
      return Response.json({ courses: [createdCourse] })
    }
    if (init?.method === 'POST' && !String(input).endsWith('/restore')) {
      return Response.json(createdCourse, { status: 201 })
    }
    if (init?.method === 'PUT') {
      return Response.json(createdCourse)
    }
    return new Response(null, { status: 204 })
  })
  const {
    createCourse,
    deleteCourseByDisplayId,
    fetchManagedCourses,
    restoreCourseByDisplayId,
    updateCourse,
  } = await loadCoursesApi()

  // When: 編集者向けの参照と更新操作を実行する。
  await fetchManagedCourses()
  await createCourse({
    idx: '50020',
    name: 'CLASS I COURSE',
    class: '1',
  })
  await updateCourse('A/B C', { name: 'UPDATED', class: 'inf' })
  await deleteCourseByDisplayId('A/B C')
  await restoreCourseByDisplayId('A/B C')

  // Then: 編集者向け一覧と display_id 付き更新パスを呼び出す。
  assert.deepEqual(
    calls.map((item) => `${item.init?.method ?? 'GET'} ${String(item.input)}`),
    [
      'GET http://localhost:3000/internal/editor/courses',
      'POST http://localhost:3000/internal/courses',
      'PUT http://localhost:3000/internal/courses/A%2FB%20C',
      'DELETE http://localhost:3000/internal/courses/A%2FB%20C',
      'POST http://localhost:3000/internal/courses/A%2FB%20C/restore',
    ]
  )
  assert.equal(
    calls[1]?.init?.body,
    JSON.stringify({ idx: '50020', name: 'CLASS I COURSE', class: '1' })
  )
  assert.equal(calls[2]?.init?.body, JSON.stringify({ name: 'UPDATED', class: 'inf' }))
})
