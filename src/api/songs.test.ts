import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内キャッシュをテストごとに分離して songs API を読み込む。
 * @returns songs API モジュール。
 */
const loadSongsApi = () => loadTestModule((cacheKey) => import(`./songs.ts?cache=${cacheKey}`))

test('fetchVersions は一度取得したバージョン一覧をセッション中に再利用する', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }],
  }
  let fetchCount = 0
  installFetchRecorder(() => {
    fetchCount += 1
    return Response.json(responseBody)
  })

  const { fetchVersions } = await loadSongsApi()
  const first = await fetchVersions()
  const second = await fetchVersions()

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('バージョン更新後は公開バージョン一覧をAPIから再取得する', async () => {
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
  const { fetchVersions, invalidateVersionCaches } = await loadSongsApi()
  await fetchVersions()

  invalidateVersionCaches()
  const afterMutation = await fetchVersions()

  assert.equal(fetchCount, 2)
  assert.deepEqual(afterMutation, responseBodies[1])
})

test('fetchSongsUpdatedAt は一度取得した更新日時をセッション中に再利用する', async () => {
  const responseBody = { updated_at: '2026-06-16T12:00:00Z' }
  let fetchCount = 0
  installFetchRecorder((input) => {
    if (String(input).endsWith('/internal/songs/updated-at')) {
      fetchCount += 1
      return Response.json(responseBody)
    }
    throw new Error(`unexpected fetch: ${String(input)}`)
  })

  const { fetchSongsUpdatedAt } = await loadSongsApi()
  const first = await fetchSongsUpdatedAt()
  const second = await fetchSongsUpdatedAt()

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('全曲APIは指定されたHTTPキャッシュ設定を利用する', async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const { fetchAllSongs } = await loadSongsApi()

  // When
  await fetchAllSongs({ cache: 'no-store' })

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/songs')
  assert.equal(calls[0]?.init?.cache, 'no-store')
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
  const { fetchSongsUpdatedAt, invalidateSongsUpdatedAtCache } = await loadSongsApi()
  await fetchSongsUpdatedAt()

  // When: 楽曲 CRUD 後を想定して更新日時キャッシュを無効化し、再取得する。
  invalidateSongsUpdatedAtCache()
  const afterMutation = await fetchSongsUpdatedAt()

  // Then: API が再実行され、更新後の値へ置き換わる。
  assert.equal(fetchCount, 2)
  assert.deepEqual(afterMutation, responseBodies[1])
})

test('無効化前に開始した楽曲更新日時リクエストは解決後もキャッシュへ戻さない', async () => {
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
  const { fetchSongsUpdatedAt, invalidateSongsUpdatedAtCache } = await loadSongsApi()
  const staleRequest = fetchSongsUpdatedAt()
  await requestStarted

  // When: リクエスト中に無効化してから古い応答を解決し、再取得する。
  invalidateSongsUpdatedAtCache()
  resolveBeforeMutation(Response.json(beforeMutation))
  await staleRequest
  const latest = await fetchSongsUpdatedAt()

  // Then: 古い応答は再キャッシュされず、APIから更新後の値を取得する。
  assert.equal(fetchCount, 2)
  assert.deepEqual(latest, afterMutation)
})

test('コースマスタAPIはコース一覧を取得する', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      courses: [
        {
          display_id: '0123456789abcdef',
          idx: '50020',
          name: 'CLASS I COURSE',
          class: '1',
        },
      ],
    })
  )
  const { fetchCourses } = await loadSongsApi()

  // When
  await fetchCourses()

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/courses')
})

test('fetchCoursesUpdatedAtは完了後の呼び出しで最新更新日時を再取得する', async () => {
  // Given: コースマスタ更新日時APIが成功する。
  let fetchCount = 0
  installFetchRecorder((input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/courses/updated-at')
    fetchCount += 1
    return Response.json({ updated_at: '2026-07-15T09:00:00Z' })
  })
  const { fetchCoursesUpdatedAt } = await loadSongsApi()

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
  const { fetchCoursesUpdatedAt } = await loadSongsApi()

  // When: 同時に2回取得する。
  const [first, second] = await Promise.all([fetchCoursesUpdatedAt(), fetchCoursesUpdatedAt()])

  // Then: 1リクエストを共有する。
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test("WORLD'S END 楽曲APIは独立リソースの新パスを呼び出す", async () => {
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const {
    createWorldsendSong,
    deleteWorldsendSongByDisplayId,
    fetchManagedWorldsendSongs,
    fetchWorldsendSongByDisplayId,
    fetchWorldsendSongs,
    restoreWorldsendSongByDisplayId,
    updateWorldsendSongs,
  } = await loadSongsApi()

  await fetchWorldsendSongs()
  await fetchManagedWorldsendSongs()
  await fetchWorldsendSongByDisplayId('A/B C')
  await updateWorldsendSongs([])
  await createWorldsendSong({
    official_idx: '1',
    title: 'test',
    artist: 'artist',
    genre: 'genre',
    bpm: null,
    released_at: null,
    jacket: null,
  })
  await deleteWorldsendSongByDisplayId('A/B C')
  await restoreWorldsendSongByDisplayId('A/B C')

  assert.deepEqual(
    calls.map((call) => String(call.input)),
    [
      'http://localhost:3000/internal/worldsend-songs',
      'http://localhost:3000/internal/editor/worldsend-songs',
      'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
      'http://localhost:3000/internal/worldsend-songs',
      'http://localhost:3000/internal/worldsend-songs',
      'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
      'http://localhost:3000/internal/worldsend-songs/A%2FB%20C/restore',
    ]
  )
})

test('スコア履歴APIはユーザーレコード配下の新パスを呼び出す', async () => {
  const calls = installFetchRecorder(() => Response.json({ entries: [] }))
  const { fetchOwnSongScoreHistory, fetchOwnWorldsendScoreHistory } = await loadSongsApi()

  await fetchOwnSongScoreHistory('A/B C', 'MASTER', 'test_user')
  await fetchOwnWorldsendScoreHistory('WE/A B', 'test_user')

  assert.deepEqual(
    calls.map((call) => String(call.input)),
    [
      'http://localhost:3000/internal/users/test_user/record/songs/A%2FB%20C/master/history',
      'http://localhost:3000/internal/users/test_user/record/worldsend-songs/WE%2FA%20B/history',
    ]
  )
})

test('フレンドランキングAPIは通常譜面ランキングのパスを呼び出す', async () => {
  const calls = installFetchRecorder(() => Response.json({ ranking: [], my_rank: null, total: 0 }))
  const { fetchSongFriendRanking } = await loadSongsApi()

  await fetchSongFriendRanking('A/B C', 'ULTIMA')

  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/friend-rankings/songs/A%2FB%20C/charts/ULTIMA'
  )
})

test("フレンドランキングAPIはWORLD'S END譜面ランキングのパスを呼び出す", async () => {
  const calls = installFetchRecorder(() => Response.json({ ranking: [], my_rank: null, total: 0 }))
  const { fetchWorldsendFriendRanking } = await loadSongsApi()

  await fetchWorldsendFriendRanking('WE/A B')

  assert.equal(
    String(calls[0]?.input),
    'http://localhost:3000/internal/friend-rankings/worldsend-songs/WE%2FA%20B'
  )
})

test('フレンドランキングAPIはAbortSignalをHTTPリクエストへ引き渡す', async () => {
  // Given: 通常譜面とWORLD'S END譜面で共通利用するAbortSignal。
  const controller = new AbortController()
  const calls = installFetchRecorder(() => Response.json({ ranking: [], my_rank: null, total: 0 }))

  // When: 両方のフレンドランキングを取得する。
  const { fetchSongFriendRanking, fetchWorldsendFriendRanking } = await loadSongsApi()
  await fetchSongFriendRanking('song-1', 'MASTER', controller.signal)
  await fetchWorldsendFriendRanking('worldsend-1', controller.signal)

  // Then: TanStack Queryが中断できるよう、どちらのfetchにも同じシグナルが渡る。
  assert.deepEqual(
    calls.map((call) => call.init?.signal),
    [controller.signal, controller.signal]
  )
})

test('fetchVersions は同時呼び出しを同じリクエストにまとめる', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM LUMINOUS', released_at: '2023-12-14' }],
  }
  let fetchCount = 0
  installFetchRecorder(async () => {
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  })

  const { fetchVersions } = await loadSongsApi()
  const [first, second] = await Promise.all([fetchVersions(), fetchVersions()])

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchSongsUpdatedAt は同時呼び出しを同じリクエストにまとめる', async () => {
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

  const { fetchSongsUpdatedAt } = await loadSongsApi()
  const [first, second] = await Promise.all([fetchSongsUpdatedAt(), fetchSongsUpdatedAt()])

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchSongsUpdatedAt は失敗後に再試行できる', async () => {
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

  const { fetchSongsUpdatedAt } = await loadSongsApi()

  await assert.rejects(() => fetchSongsUpdatedAt(), /network error/)
  const result = await fetchSongsUpdatedAt()

  assert.equal(fetchCount, 2)
  assert.equal(result.updated_at, '2026-06-16T12:00:00Z')
})
