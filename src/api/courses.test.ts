import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestCacheKey, setupTestEnvironment } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して courses API 関数群を読み込む。
 *
 * @returns courses API モジュール。
 */
const loadCoursesApi = async () => {
  setupTestEnvironment()
  const cacheKey = createTestCacheKey()
  return import(`./courses.ts?cache=${cacheKey}`)
}

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
  const called: Array<{ url: string; method: string; body: string | null }> = []
  globalThis.fetch = async (input, init) => {
    called.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : null,
    })
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
  }
  const {
    createCourse,
    deleteCourseByDisplayId,
    fetchManagedCourses,
    restoreCourseByDisplayId,
    updateCourse,
  } = await loadCoursesApi()

  // When: 編集者向けの参照と更新操作を実行する。
  const list = await fetchManagedCourses()
  const created = await createCourse({
    idx: '50020',
    name: 'CLASS I COURSE',
    class: '1',
  })
  const updated = await updateCourse('A/B C', { name: 'UPDATED', class: 'inf' })
  await deleteCourseByDisplayId('A/B C')
  await restoreCourseByDisplayId('A/B C')

  // Then: 編集者向け一覧と display_id 付き更新パスを呼び出す。
  assert.deepEqual(list, { courses: [createdCourse] })
  assert.deepEqual(created, createdCourse)
  assert.deepEqual(updated, createdCourse)
  assert.deepEqual(
    called.map((item) => `${item.method} ${item.url}`),
    [
      'GET http://localhost:3000/internal/editor/courses',
      'POST http://localhost:3000/internal/courses',
      'PUT http://localhost:3000/internal/courses/A%2FB%20C',
      'DELETE http://localhost:3000/internal/courses/A%2FB%20C',
      'POST http://localhost:3000/internal/courses/A%2FB%20C/restore',
    ]
  )
  assert.equal(
    called[1]?.body,
    JSON.stringify({ idx: '50020', name: 'CLASS I COURSE', class: '1' })
  )
  assert.equal(called[2]?.body, JSON.stringify({ name: 'UPDATED', class: 'inf' }))
})
