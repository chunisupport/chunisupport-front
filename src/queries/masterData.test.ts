import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { onlineManager } from '@tanstack/solid-query'
import { SONGS_UPDATED_AT_CACHE_TTL_MS } from '../constants/songMaster'
import { appQueryClient } from '../lib/queryClient'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

beforeEach(() => appQueryClient.clear())
afterEach(() => appQueryClient.clear())

/**
 * テスト用環境を準備してマスタqueryを読み込む。
 * @returns マスタqueryモジュール。
 */
const loadMasterDataQueries = () => loadTestModule(() => import('./masterData.ts'))

test('バージョン更新後は公開バージョン一覧をAPIから再取得する', async () => {
  // Given: APIの応答を準備する。
  const responseBodies = [
    { versions: [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }] },
    { versions: [{ name: 'CHUNITHM X-VERSE', released_at: '2024-12-12' }] },
  ]
  let fetchCount = 0
  installFetchRecorder(() => {
    const responseBody = responseBodies[fetchCount]
    fetchCount += 1
    return Response.json(responseBody)
  })
  // When: query経由で取得する。
  const { fetchVersions, invalidateVersionCaches } = await loadMasterDataQueries()
  await fetchVersions()

  invalidateVersionCaches()
  const afterMutation = await fetchVersions()

  // Then: 取得回数と結果が期待どおりになる。
  assert.equal(fetchCount, 2)
  assert.deepEqual(afterMutation, responseBodies[1])
})

test('fetchSongsUpdatedAt は不正な更新日時を拒否し、失敗をキャッシュせず再試行する', async () => {
  // Given: 契約に違反する更新日時レスポンス。
  for (const invalidResponse of [{}, { updated_at: 123 }, { updated_at: false }, null]) {
    appQueryClient.clear()
    let fetchCount = 0
    installFetchRecorder(() => {
      fetchCount += 1
      return Response.json(fetchCount === 1 ? invalidResponse : { updated_at: null })
    })
    const { fetchSongsUpdatedAt } = await loadMasterDataQueries()

    // When / Then: 不正応答を拒否し、次の正常な null 応答は取得・キャッシュできる。
    await assert.rejects(() => fetchSongsUpdatedAt(), TypeError)
    assert.deepEqual(await fetchSongsUpdatedAt(), { updated_at: null })
    assert.deepEqual(await fetchSongsUpdatedAt(), { updated_at: null })
    assert.equal(fetchCount, 2)
  }
})

test('fetchSongsUpdatedAt はTTL内であれば取得済みの更新日時を再利用する', async (t) => {
  // Given: 更新日時を一度取得済みで、TTL 直前まで時間が経過している。
  t.mock.timers.enable({ apis: ['Date'], now: 1 })
  const responseBody = { updated_at: '2026-06-16T12:00:00Z' }
  let fetchCount = 0
  installFetchRecorder((input) => {
    if (String(input).endsWith('/internal/songs/updated-at')) {
      fetchCount += 1
      return Response.json(responseBody)
    }
    throw new Error(`unexpected fetch: ${String(input)}`)
  })
  const { fetchSongsUpdatedAt } = await loadMasterDataQueries()
  const first = await fetchSongsUpdatedAt()
  t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS - 1)

  // When: 再度更新日時を取得する。
  const second = await fetchSongsUpdatedAt()

  // Then: API は再実行されず、同じレスポンスを返す。
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchSongsUpdatedAt はTTL経過後にAPIから更新日時を再検証する', async (t) => {
  // Given: 更新日時 T1 を取得済みで、その後サーバー側が T2 に更新されている。
  t.mock.timers.enable({ apis: ['Date'], now: 1 })
  const responseBodies = [
    { updated_at: '2026-06-16T12:00:00Z' },
    { updated_at: '2026-07-20T09:00:00Z' },
  ]
  let fetchCount = 0
  const calls = installFetchRecorder(() => {
    const responseBody = responseBodies[fetchCount]
    fetchCount += 1
    return Response.json(responseBody)
  })
  const { fetchSongsUpdatedAt } = await loadMasterDataQueries()
  await fetchSongsUpdatedAt()

  // When: TTL 経過後に更新日時を取得する。
  t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS)
  const revalidated = await fetchSongsUpdatedAt()

  // Then: HTTP キャッシュを使わずに API を再実行し、T2 を返す。
  assert.equal(fetchCount, 2)
  assert.deepEqual(revalidated, responseBodies[1])
  assert.equal(String(calls[1]?.input), 'http://localhost:3000/internal/songs/updated-at')
  assert.equal(calls[1]?.init?.cache, 'no-cache')
})

test('楽曲更新日時キャッシュは無効化後にAPIから最新値を再取得する', async () => {
  // Given: 初回の更新日時を取得してメモリへキャッシュする。
  const responseBodies = [
    { updated_at: '2026-06-16T12:00:00Z' },
    { updated_at: '2026-07-20T09:00:00Z' },
  ]
  let fetchCount = 0
  installFetchRecorder((input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/songs/updated-at')
    const responseBody = responseBodies[fetchCount]
    fetchCount += 1
    return Response.json(responseBody)
  })
  const { fetchSongsUpdatedAt, invalidateSongsUpdatedAtCache } = await loadMasterDataQueries()
  await fetchSongsUpdatedAt()

  // When: 楽曲 CRUD 後を想定して更新日時キャッシュを無効化し、再取得する。
  invalidateSongsUpdatedAtCache()
  const afterMutation = await fetchSongsUpdatedAt()

  // Then: API が再実行され、更新後の値へ置き換わる。
  assert.equal(fetchCount, 2)
  assert.deepEqual(afterMutation, responseBodies[1])
})

test('無効化前に開始した楽曲更新日時の取得も最新値で解決し、古い応答は採用しない', async () => {
  // Given: 無効化前の更新日時リクエストを応答待ちにする。
  const beforeMutation = { updated_at: '2026-06-16T12:00:00Z' }
  const afterMutation = { updated_at: '2026-07-20T09:00:00Z' }
  let fetchCount = 0
  let resolveBeforeMutation!: (response: Response) => void
  let notifyRequestStarted!: () => void
  const requestStarted = new Promise<void>((resolve) => {
    notifyRequestStarted = resolve
  })
  installFetchRecorder((input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/songs/updated-at')
    fetchCount += 1
    if (fetchCount === 1) {
      notifyRequestStarted()
      return new Promise<Response>((resolve) => {
        resolveBeforeMutation = resolve
      })
    }
    return Response.json(afterMutation)
  })
  const { fetchSongsUpdatedAt, invalidateSongsUpdatedAtCache } = await loadMasterDataQueries()
  const staleRequest = fetchSongsUpdatedAt()
  const sharedRequest = fetchSongsUpdatedAt()
  await requestStarted

  // When: リクエスト中に無効化してから古い応答を解決し、再取得する。
  invalidateSongsUpdatedAtCache()
  resolveBeforeMutation(Response.json(beforeMutation))
  assert.deepEqual(await staleRequest, afterMutation)
  assert.deepEqual(await sharedRequest, afterMutation)
  const latest = await fetchSongsUpdatedAt()

  // Then: 古い応答は再キャッシュされず、APIから更新後の値を取得する。
  assert.equal(fetchCount, 2)
  assert.deepEqual(latest, afterMutation)
})

test('fetchCoursesUpdatedAtは完了後の呼び出しで最新更新日時を再取得する', async () => {
  // Given: コースマスタ更新日時APIが成功する。
  let fetchCount = 0
  installFetchRecorder((input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/courses/updated-at')
    fetchCount += 1
    return Response.json({ updated_at: '2026-07-15T09:00:00Z' })
  })
  const { fetchCoursesUpdatedAt } = await loadMasterDataQueries()

  // When: 直列に2回取得する。
  await fetchCoursesUpdatedAt()
  await fetchCoursesUpdatedAt()

  // Then: 呼び出しごとにAPIから最新値を取得する。
  assert.equal(fetchCount, 2)
})

test('fetchCoursesUpdatedAtは同時呼び出しを1リクエストにまとめる', async () => {
  // Given: 応答まで待機するコースマスタ更新日時API。
  let fetchCount = 0
  installFetchRecorder(async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/courses/updated-at')
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json({ updated_at: '2026-07-15T09:00:00Z' })
  })
  const { fetchCoursesUpdatedAt } = await loadMasterDataQueries()

  // When: 同時に2回取得する。
  const [first, second] = await Promise.all([fetchCoursesUpdatedAt(), fetchCoursesUpdatedAt()])

  // Then: 1リクエストを共有する。
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchSongsUpdatedAt は同時呼び出しを同じリクエストにまとめる', async () => {
  // Given: APIの応答を準備する。
  const responseBody = { updated_at: '2026-06-16T12:00:00Z' }
  let fetchCount = 0
  installFetchRecorder(async (input) => {
    if (String(input).endsWith('/internal/songs/updated-at')) {
      fetchCount += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return Response.json(responseBody)
    }
    throw new Error(`unexpected fetch: ${String(input)}`)
  })

  // When: query経由で取得する。
  const { fetchSongsUpdatedAt } = await loadMasterDataQueries()
  const [first, second] = await Promise.all([fetchSongsUpdatedAt(), fetchSongsUpdatedAt()])

  // Then: 取得回数と結果が期待どおりになる。
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchSongsUpdatedAt は失敗後に再試行できる', async () => {
  // Given: APIの応答を準備する。
  let fetchCount = 0
  installFetchRecorder((input) => {
    if (!String(input).endsWith('/internal/songs/updated-at')) {
      throw new Error(`unexpected fetch: ${String(input)}`)
    }

    fetchCount += 1
    if (fetchCount === 1) {
      throw new Error('network error')
    }

    return Response.json({ updated_at: '2026-06-16T12:00:00Z' })
  })

  // When: query経由で取得する。
  const { fetchSongsUpdatedAt } = await loadMasterDataQueries()

  await assert.rejects(() => fetchSongsUpdatedAt(), /network error/)
  const result = await fetchSongsUpdatedAt()

  // Then: 取得回数と結果が期待どおりになる。
  assert.equal(fetchCount, 2)
  assert.equal(result.updated_at, '2026-06-16T12:00:00Z')
})

test('fetchGenres はジャンル個別APIから取得したジャンルを返す', async () => {
  // Given: ジャンル個別APIの応答を準備する。
  const calls = installFetchRecorder(() =>
    Response.json({ genres: [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }] })
  )
  const { fetchGenres } = await loadMasterDataQueries()

  // When: ジャンル一覧を取得する。
  const genres = await fetchGenres()

  // Then: 全マスタではなく個別APIに接続し、そのジャンルを返す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/master/genres')
  assert.deepEqual(genres, [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }])
})

for (const name of ['fetchVersions', 'fetchMasterData', 'fetchGenres'] as const) {
  test(`${name} は同時取得・セッション再利用を行い、GC期限を設けない`, async () => {
    // Given: セッション中のマスタAPI。
    const queries = await loadMasterDataQueries()
    let complete!: (response: Response) => void
    const response = new Promise<Response>((resolve) => {
      complete = resolve
    })
    let started!: () => void
    const requestStarted = new Promise<void>((resolve) => {
      started = resolve
    })
    const calls = installFetchRecorder(() => {
      started()
      return response
    })

    // When: 応答を保留したまま同時取得し、完了後に再取得する。
    const firstRequest = queries[name]()
    await requestStarted
    const secondRequest = queries[name]()
    complete(Response.json({ versions: [], genres: [] }))
    const [first, second] = await Promise.all([firstRequest, secondRequest])
    const cached = await queries[name]()

    // Then: 1リクエストを共有し、セッション中はGCされない。
    assert.equal(calls.length, 1)
    assert.equal(first, second)
    assert.equal(first, cached)
    const options = {
      fetchVersions: queries.versionsQueryOptions(),
      fetchMasterData: queries.masterDataQueryOptions(),
      fetchGenres: queries.genresQueryOptions(),
    }[name]
    assert.equal(options.staleTime, Infinity)
    assert.equal(options.gcTime, Infinity)
    assert.equal(options.retry, false)
  })
}

for (const name of [
  'fetchVersions',
  'fetchMasterData',
  'fetchGenres',
  'fetchCoursesUpdatedAt',
] as const) {
  test(`${name} は失敗を自動再試行せず、次の呼び出しで再取得できる`, async () => {
    // Given: 初回だけ失敗するAPI。
    const queries = await loadMasterDataQueries()
    let count = 0
    installFetchRecorder(() => {
      if (++count === 1) throw new Error('network error')
      return Response.json({
        versions: [],
        genres: [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }],
        updated_at: null,
      })
    })

    // When: 失敗後に明示的に再取得する。
    await assert.rejects(queries[name](), /network error/)
    assert.equal(count, 1)
    const result = await queries[name]()

    // Then: 失敗結果は再利用せず、成功時の内容を返す。
    assert.equal(count, 2)
    if (name === 'fetchGenres') {
      assert.deepEqual(result, [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }])
    }
  })
}

for (const name of ['fetchVersions', 'fetchMasterData'] as const) {
  test(`${name} は無効化前の呼び出しも最新値で解決し、古い応答で上書きしない`, async () => {
    // Given: 初回の応答を保留するAPI。
    const queries = await loadMasterDataQueries()
    let complete!: (response: Response) => void
    let started!: () => void
    const requestStarted = new Promise<void>((resolve) => {
      started = resolve
    })
    let count = 0
    installFetchRecorder(() => {
      if (++count === 1) {
        started()
        return new Promise<Response>((resolve) => {
          complete = resolve
        })
      }
      return Response.json({ versions: [], genres: [], marker: 'new' })
    })
    const pending = queries[name]()
    await requestStarted

    // When: 無効化後、新しい取得を完了してから古い応答を返す。
    queries.invalidateVersionCaches()
    const latest = await queries[name]()
    complete(Response.json({ versions: [], genres: [], marker: 'old' }))
    assert.equal(await pending, latest)

    // Then: 新しい成功結果だけをキャッシュとして利用する。
    assert.equal(await queries[name](), latest)
    assert.equal(count, 2)
  })
}

test('バージョンキャッシュ無効化は全マスタも破棄し、ジャンルは保持する', async () => {
  // Given: 3種類のセッションキャッシュ。
  const queries = await loadMasterDataQueries()
  const calls = installFetchRecorder(() => Response.json({ versions: [], genres: [] }))
  await Promise.all([queries.fetchVersions(), queries.fetchMasterData(), queries.fetchGenres()])

  // When: バージョンと全マスタを無効化する。
  queries.invalidateVersionCaches()
  await Promise.all([queries.fetchVersions(), queries.fetchMasterData(), queries.fetchGenres()])

  // Then: ジャンル以外の2件だけを再取得する。
  assert.equal(calls.length, 5)
  const countsByUrl = calls.reduce<Record<string, number>>((counts, call) => {
    const url = String(call.input)
    counts[url] = (counts[url] ?? 0) + 1
    return counts
  }, {})
  assert.deepEqual(countsByUrl, {
    'http://localhost:3000/internal/master/versions': 2,
    'http://localhost:3000/internal/master': 2,
    'http://localhost:3000/internal/master/genres': 1,
  })
})

test('全マスタキーの前方一致による無効化はバージョンとジャンルを巻き込まない', async () => {
  // Given: 全マスタ・バージョン・ジャンルを取得済み。
  const queries = await loadMasterDataQueries()
  installFetchRecorder(() => Response.json({ versions: [], genres: [] }))
  await Promise.all([queries.fetchVersions(), queries.fetchMasterData(), queries.fetchGenres()])

  // When: 全マスタキーをexact指定なしで無効化する。
  await appQueryClient.invalidateQueries({ queryKey: queries.masterDataQueryKeys.masterData() })

  // Then: 全マスタだけを無効化し、兄弟のqueryは有効なまま保持する。
  assert.deepEqual(queries.masterDataQueryKeys.masterData(), ['master', 'all'])
  assert.equal(
    appQueryClient.getQueryState(queries.masterDataQueryKeys.masterData())?.isInvalidated,
    true
  )
  assert.equal(
    appQueryClient.getQueryState(queries.masterDataQueryKeys.versions())?.isInvalidated,
    false
  )
  assert.equal(
    appQueryClient.getQueryState(queries.masterDataQueryKeys.genres())?.isInvalidated,
    false
  )
})

test('オフライン時も更新日時とマスタの取得は一時停止せず、通信失敗を呼び出し元へ返す', async (t) => {
  // Given: ブラウザーがオフラインで、通信が失敗する。
  onlineManager.setOnline(false)
  t.after(() => onlineManager.setOnline(true))
  installFetchRecorder(() => {
    throw new Error('network error')
  })
  const queries = await loadMasterDataQueries()

  // When & Then: 再接続を待たずに通信失敗としてrejectされる。
  await assert.rejects(() => queries.fetchSongsUpdatedAt(), /network error/)
  await assert.rejects(() => queries.fetchCoursesUpdatedAt(), /network error/)
  await assert.rejects(() => queries.fetchVersions(), /network error/)
  await assert.rejects(() => queries.fetchMasterData(), /network error/)
  await assert.rejects(() => queries.fetchGenres(), /network error/)
})
