import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して courses API 関数群を読み込む。
 * @param authenticate - ログイン中の Firebase ユーザーを用意するか。
 * @returns courses API モジュール。
 */
const loadCoursesApi = (authenticate = false) =>
  loadTestModule((cacheKey) => import(`./courses.ts?cache=${cacheKey}`), { authenticate })

type CoursesApi = Awaited<ReturnType<typeof loadCoursesApi>>

test('コーススコア履歴を認証付きで取得し、APIの順序を維持する', async (t) => {
  // Given: 現行ベストと過去ベストを返すAPI。
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  const entries = [
    {
      score: 3010000,
      is_clear: true,
      combo_lamp: 'ALL JUSTICE',
      updated_at: '2026-11-01T12:34:56Z',
    },
    { score: 2020000, is_clear: false, combo_lamp: null, updated_at: '2026-10-01T08:00:00Z' },
  ]
  const calls = installFetchRecorder(() => Response.json({ entries }))
  const { fetchOwnCourseScoreHistory } = await loadCoursesApi(true)

  // When: 自分のコーススコア履歴を取得する。
  const result = await fetchOwnCourseScoreHistory('test user', 'A/B C')

  // Then: 認証付きのユーザー別パスからレスポンスをそのまま取得する。
  assert.equal(calls.length, 1)
  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/users/test%20user/record/courses/A%2FB%20C/history'
  )
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.deepEqual(result, { entries })
})

test('履歴未登録だけを空履歴にして、コース不存在はエラーにする', async (t) => {
  // Given: 履歴未登録とコース不存在を別のコードで返すAPI。
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  installFetchRecorder((input) => {
    const code = String(input).endsWith('/played/history') ? 'score_history_not_found' : 'not_found'
    return Response.json({ error: { status: 404, code } }, { status: 404 })
  })
  const { fetchOwnCourseScoreHistory } = await loadCoursesApi(true)

  // When & Then: 履歴未登録は空配列、コース不存在は取得エラーとして扱う。
  assert.deepEqual(await fetchOwnCourseScoreHistory('test_user', 'played'), { entries: [] })
  await assert.rejects(fetchOwnCourseScoreHistory('test_user', 'missing'), { code: 'not_found' })
})

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

test('コース構成を取得・一括更新し、空配列でクリアできる', async (t) => {
  // Given: 楽曲候補を返す公開APIと204を返す認証付き更新API。
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  const tracks = [
    {
      track_no: 1,
      selection_type: 'RANDOM_FILTER',
      filter: { min_level: '14+', genres: ['ゲキマイ'] },
    },
  ] as const
  const detail = { ...managedCourse, tracks: [{ ...tracks[0], candidates: [] }] }
  const calls = installFetchRecorder((_input, init) =>
    init?.method === 'PUT' ? new Response(null, { status: 204 }) : Response.json(detail)
  )
  const { fetchCourseDetail, replaceCourseTracks } = await loadCoursesApi(true)
  const path = 'http://localhost:3000/internal/courses/A%2FB%20C'

  // When: 詳細取得、設定更新、構成クリアを実行する。
  const result = await fetchCourseDetail('A/B C')
  await replaceCourseTracks('A/B C', [
    { ...tracks[0], filter: { min_level: '14+', genres: ['ゲキマイ'] } },
  ])
  await replaceCourseTracks('A/B C', [])

  // Then: 更新は同じトラック用パスに認証とJSONを送信する。
  assert.deepEqual(result, detail)
  assert.deepEqual(
    calls.map(({ input }) => String(input)),
    [path, `${path}/tracks`, `${path}/tracks`]
  )
  assert.equal(new Headers(calls[1]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), { tracks })
  assert.equal(calls[2]?.init?.body, '{"tracks":[]}')
})
