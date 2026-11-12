import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して courses API 関数群を読み込む。
 * @returns courses API モジュール。
 */
const loadCoursesApi = () => loadTestModule((cacheKey) => import(`./courses.ts?cache=${cacheKey}`))

type CoursesApi = Awaited<ReturnType<typeof loadCoursesApi>>

/** 成功レスポンスとして返す編集者向けコース。 */
const managedCourse = {
  id: '0123456789abcdef',
  idx: '50020',
  name: 'CLASS I COURSE',
  class: '1',
  is_deleted: false,
  updated_at: '2026-07-14T10:00:00Z',
}

for (const scenario of [
  {
    name: '一覧取得は編集者向け一覧パスを呼び出す',
    respond: () => Response.json({ courses: [managedCourse] }),
    execute: (api: CoursesApi) => api.fetchManagedCourses(),
    method: 'GET',
    url: 'http://localhost:3000/internal/editor/courses',
    body: undefined,
  },
  {
    name: '追加はコースパスへ作成内容を送信する',
    respond: () => Response.json(managedCourse, { status: 201 }),
    execute: (api: CoursesApi) =>
      api.createCourse({ idx: '50020', name: 'CLASS I COURSE', class: '1' }),
    method: 'POST',
    url: 'http://localhost:3000/internal/courses',
    body: '{"idx":"50020","name":"CLASS I COURSE","class":"1"}',
  },
  {
    name: '更新はエンコードしたIDのパスへ更新内容を送信する',
    respond: () => Response.json(managedCourse),
    execute: (api: CoursesApi) => api.updateCourse('A/B C', { name: 'UPDATED', class: 'inf' }),
    method: 'PUT',
    url: 'http://localhost:3000/internal/courses/A%2FB%20C',
    body: '{"name":"UPDATED","class":"inf"}',
  },
  {
    name: '削除はエンコードしたIDのパスを呼び出す',
    respond: () => new Response(null, { status: 204 }),
    execute: (api: CoursesApi) => api.deleteCourseByDisplayId('A/B C'),
    method: 'DELETE',
    url: 'http://localhost:3000/internal/courses/A%2FB%20C',
    body: undefined,
  },
  {
    name: '復元はエンコードしたIDの復元パスを呼び出す',
    respond: () => new Response(null, { status: 204 }),
    execute: (api: CoursesApi) => api.restoreCourseByDisplayId('A/B C'),
    method: 'POST',
    url: 'http://localhost:3000/internal/courses/A%2FB%20C/restore',
    body: undefined,
  },
]) {
  test(`編集者向けコースAPIの${scenario.name}`, async (t) => {
    // Given: この操作専用のfetchと成功レスポンス。
    const originalFetch = globalThis.fetch
    t.after(() => {
      globalThis.fetch = originalFetch
    })
    const calls = installFetchRecorder(scenario.respond)
    const api = await loadCoursesApi()

    // When: 対象の操作だけを実行する。
    await scenario.execute(api)

    // Then: 対象のパス・メソッド・本文で1回だけ呼び出す。
    assert.equal(calls.length, 1)
    assert.equal(String(calls[0]?.input), scenario.url)
    assert.equal(calls[0]?.init?.method ?? 'GET', scenario.method)
    assert.equal(calls[0]?.init?.body, scenario.body)
  })
}
