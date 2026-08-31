import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * テスト用の環境変数を設定する。
 *
 * @returns なし。
 */
const setupApiTestEnv = (): void => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
}

/**
 * モジュール内キャッシュをテストごとに分離して fetchVersions を読み込む。
 *
 * @returns fetchVersions 関数。
 */
const loadFetchVersions = async () => {
  setupApiTestEnv()
  const cacheKey = `${Date.now()}-${Math.random()}`
  const { fetchVersions } = await import(`./songs.ts?cache=${cacheKey}`)
  return fetchVersions
}

/**
 * モジュール内定数をテストごとに再評価して songs API 関数群を読み込む。
 *
 * @returns songs API モジュール。
 */
const loadSongsApi = async () => {
  setupApiTestEnv()
  const cacheKey = `${Date.now()}-${Math.random()}`
  return import(`./songs.ts?cache=${cacheKey}`)
}

test('fetchVersions は一度取得したバージョン一覧をセッション中に再利用する', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }],
  }
  let fetchCount = 0

  globalThis.fetch = async () => {
    fetchCount += 1
    return Response.json(responseBody)
  }

  const fetchVersions = await loadFetchVersions()

  const first = await fetchVersions()
  const second = await fetchVersions()

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})

test('fetchSongsUpdatedAt は一度取得した更新日時をセッション中に再利用する', async () => {
  const responseBody = { updated_at: '2026-06-16T12:00:00Z' }
  let fetchCount = 0

  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/internal/songs/updated-at')) {
      fetchCount += 1
      return Response.json(responseBody)
    }
    throw new Error(`unexpected fetch: ${String(input)}`)
  }

  const { fetchSongsUpdatedAt } = await loadSongsApi()

  const first = await fetchSongsUpdatedAt()
  const second = await fetchSongsUpdatedAt()

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})

test('全曲APIは指定されたHTTPキャッシュ設定を利用する', async () => {
  // Given
  const responseBody = { songs: [] }
  let calledUrl = ''
  let calledCache: RequestCache | undefined
  globalThis.fetch = async (input, init) => {
    calledUrl = String(input)
    calledCache = init?.cache
    return Response.json(responseBody)
  }
  const { fetchAllSongs } = await loadSongsApi()

  // When
  const result = await fetchAllSongs({ cache: 'no-store' })

  // Then
  assert.equal(calledUrl, 'http://localhost:3000/internal/songs')
  assert.equal(calledCache, 'no-store')
  assert.deepEqual(result, responseBody)
})

test('楽曲更新日時キャッシュは無効化後にAPIから最新値を再取得する', async () => {
  // Given: 初回の更新日時を取得してメモリへキャッシュする。
  const responseBodies = [
    { updated_at: '2026-06-16T12:00:00Z' },
    { updated_at: '2026-07-20T09:00:00Z' },
  ]
  let fetchCount = 0
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/songs/updated-at')
    const responseBody = responseBodies[fetchCount]
    fetchCount += 1
    return Response.json(responseBody)
  }
  const { fetchSongsUpdatedAt, invalidateSongsUpdatedAtCache } = await loadSongsApi()
  const beforeMutation = await fetchSongsUpdatedAt()

  // When: 楽曲 CRUD 後を想定して更新日時キャッシュを無効化し、再取得する。
  invalidateSongsUpdatedAtCache()
  const afterMutation = await fetchSongsUpdatedAt()

  // Then: API が再実行され、更新後の値へ置き換わる。
  assert.equal(fetchCount, 2)
  assert.deepEqual(beforeMutation, responseBodies[0])
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
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/songs/updated-at')
    fetchCount += 1
    if (fetchCount === 1) {
      notifyRequestStarted()
      return new Promise<Response>((resolve) => {
        resolveBeforeMutation = resolve
      })
    }
    return Response.json(afterMutation)
  }
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
  const responseBody = {
    courses: [
      {
        display_id: '0123456789abcdef',
        idx: '50020',
        name: 'CLASS I COURSE',
        class: '1',
      },
    ],
  }
  let calledUrl = ''
  globalThis.fetch = async (input) => {
    calledUrl = String(input)
    return Response.json(responseBody)
  }
  const { fetchCourses } = await loadSongsApi()

  // When
  const result = await fetchCourses()

  // Then
  assert.equal(calledUrl, 'http://localhost:3000/internal/courses')
  assert.deepEqual(result, responseBody)
})

test('fetchCoursesUpdatedAtは完了後の呼び出しで最新更新日時を再取得する', async () => {
  // Given: コースマスタ更新日時APIが成功する。
  const responseBody = { updated_at: '2026-07-15T09:00:00Z' }
  let fetchCount = 0
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/courses/updated-at')
    fetchCount += 1
    return Response.json(responseBody)
  }
  const { fetchCoursesUpdatedAt } = await loadSongsApi()

  // When: 直列に2回取得する。
  const first = await fetchCoursesUpdatedAt()
  const second = await fetchCoursesUpdatedAt()

  // Then: 呼び出しごとにAPIから最新値を取得する。
  assert.equal(fetchCount, 2)
  assert.deepEqual(second, responseBody)
  assert.deepEqual(first, responseBody)
})

test('fetchCoursesUpdatedAtは同時呼び出しを1リクエストにまとめる', async () => {
  // Given: 応答まで待機するコースマスタ更新日時API。
  const responseBody = { updated_at: '2026-07-15T09:00:00Z' }
  let fetchCount = 0
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'http://localhost:3000/internal/courses/updated-at')
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  }
  const { fetchCoursesUpdatedAt } = await loadSongsApi()

  // When: 同時に2回取得する。
  const [first, second] = await Promise.all([fetchCoursesUpdatedAt(), fetchCoursesUpdatedAt()])

  // Then: 1リクエストを共有する。
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test("WORLD'S END 楽曲APIは独立リソースの新パスを呼び出す", async () => {
  const calledUrls: string[] = []

  globalThis.fetch = async (input) => {
    calledUrls.push(String(input))
    return Response.json({ songs: [] })
  }

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

  assert.deepEqual(calledUrls, [
    'http://localhost:3000/internal/worldsend-songs',
    'http://localhost:3000/internal/editor/worldsend-songs',
    'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
    'http://localhost:3000/internal/worldsend-songs',
    'http://localhost:3000/internal/worldsend-songs',
    'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
    'http://localhost:3000/internal/worldsend-songs/A%2FB%20C/restore',
  ])
})

test('スコア履歴APIはユーザーレコード配下の新パスを呼び出す', async () => {
  const calledUrls: string[] = []

  globalThis.fetch = async (input) => {
    calledUrls.push(String(input))
    return Response.json({ entries: [] })
  }

  const { fetchOwnSongScoreHistory, fetchOwnWorldsendScoreHistory } = await loadSongsApi()

  await fetchOwnSongScoreHistory('A/B C', 'MASTER', 'test_user')
  await fetchOwnWorldsendScoreHistory('WE/A B', 'test_user')

  assert.deepEqual(calledUrls, [
    'http://localhost:3000/internal/users/test_user/record/songs/A%2FB%20C/master/history',
    'http://localhost:3000/internal/users/test_user/record/worldsend-songs/WE%2FA%20B/history',
  ])
})

test('フレンドランキングAPIは通常譜面ランキングのパスを呼び出す', async () => {
  const calledUrls: string[] = []

  globalThis.fetch = async (input) => {
    calledUrls.push(String(input))
    return Response.json({ ranking: [], my_rank: null, total: 0 })
  }

  const { fetchSongFriendRanking } = await loadSongsApi()

  await fetchSongFriendRanking('A/B C', 'ULTIMA')

  assert.deepEqual(calledUrls, [
    'http://localhost:3000/internal/friend-rankings/songs/A%2FB%20C/charts/ULTIMA',
  ])
})

test("フレンドランキングAPIはWORLD'S END譜面ランキングのパスを呼び出す", async () => {
  const calledUrls: string[] = []

  globalThis.fetch = async (input) => {
    calledUrls.push(String(input))
    return Response.json({ ranking: [], my_rank: null, total: 0 })
  }

  const { fetchWorldsendFriendRanking } = await loadSongsApi()

  await fetchWorldsendFriendRanking('WE/A B')

  assert.deepEqual(calledUrls, [
    'http://localhost:3000/internal/friend-rankings/worldsend-songs/WE%2FA%20B',
  ])
})

test('フレンドランキングAPIはAbortSignalをHTTPリクエストへ引き渡す', async () => {
  // Given: 通常譜面とWORLD'S END譜面で共通利用するAbortSignal。
  const controller = new AbortController()
  const signals: (AbortSignal | null | undefined)[] = []
  globalThis.fetch = async (_input, init) => {
    signals.push(init?.signal)
    return Response.json({ ranking: [], my_rank: null, total: 0 })
  }

  // When: 両方のフレンドランキングを取得する。
  const { fetchSongFriendRanking, fetchWorldsendFriendRanking } = await loadSongsApi()
  await fetchSongFriendRanking('song-1', 'MASTER', controller.signal)
  await fetchWorldsendFriendRanking('worldsend-1', controller.signal)

  // Then: TanStack Queryが中断できるよう、どちらのfetchにも同じシグナルが渡る。
  assert.deepEqual(signals, [controller.signal, controller.signal])
})

test('fetchVersions は同時呼び出しを同じリクエストにまとめる', async () => {
  const responseBody = {
    versions: [{ name: 'CHUNITHM LUMINOUS', released_at: '2023-12-14' }],
  }
  let fetchCount = 0

  globalThis.fetch = async () => {
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(responseBody)
  }

  const fetchVersions = await loadFetchVersions()

  const [first, second] = await Promise.all([fetchVersions(), fetchVersions()])

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})

test('fetchSongsUpdatedAt は同時呼び出しを同じリクエストにまとめる', async () => {
  const responseBody = { updated_at: '2026-06-16T12:00:00Z' }
  let fetchCount = 0

  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/internal/songs/updated-at')) {
      fetchCount += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return Response.json(responseBody)
    }
    throw new Error(`unexpected fetch: ${String(input)}`)
  }

  const { fetchSongsUpdatedAt } = await loadSongsApi()

  const [first, second] = await Promise.all([fetchSongsUpdatedAt(), fetchSongsUpdatedAt()])

  assert.equal(fetchCount, 1)
  assert.equal(first, second)
  assert.deepEqual(second, responseBody)
})

test('fetchSongsUpdatedAt は失敗後に再試行できる', async () => {
  let fetchCount = 0

  globalThis.fetch = async (input) => {
    if (!String(input).endsWith('/internal/songs/updated-at')) {
      throw new Error(`unexpected fetch: ${String(input)}`)
    }

    fetchCount += 1
    if (fetchCount === 1) {
      throw new Error('network error')
    }

    return Response.json({ updated_at: '2026-06-16T12:00:00Z' })
  }

  const { fetchSongsUpdatedAt } = await loadSongsApi()

  await assert.rejects(() => fetchSongsUpdatedAt(), /network error/)
  const result = await fetchSongsUpdatedAt()

  assert.equal(fetchCount, 2)
  assert.equal(result.updated_at, '2026-06-16T12:00:00Z')
})
