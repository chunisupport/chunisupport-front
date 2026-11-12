import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * テスト用環境を準備して songs API を読み込む。
 * @returns songs API モジュール。
 */
const loadSongsApi = () => loadTestModule((cacheKey) => import(`./songs.ts?cache=${cacheKey}`))

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

test("WORLD'S END楽曲APIは指定されたHTTPキャッシュ設定を利用する", async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const { fetchWorldsendSongs } = await loadSongsApi()

  // When
  await fetchWorldsendSongs({ cache: 'no-store' })

  // Then
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/worldsend-songs')
  assert.equal(calls[0]?.init?.cache, 'no-store')
})

test('コースマスタAPIはコース一覧を取得する', async () => {
  // Given
  const calls = installFetchRecorder(() =>
    Response.json({
      courses: [
        {
          id: '0123456789abcdef',
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

for (const { label, operation, url, method } of [
  {
    label: '一覧取得',
    operation: 'fetchWorldsendSongs',
    url: 'http://localhost:3000/internal/worldsend-songs',
    method: 'GET',
  },
  {
    label: '管理用一覧取得',
    operation: 'fetchManagedWorldsendSongs',
    url: 'http://localhost:3000/internal/editor/worldsend-songs',
    method: 'GET',
  },
  {
    label: '詳細取得',
    operation: 'fetchWorldsendSongByDisplayId',
    url: 'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
    method: 'GET',
  },
  {
    label: '削除',
    operation: 'deleteWorldsendSongByDisplayId',
    url: 'http://localhost:3000/internal/worldsend-songs/A%2FB%20C',
    method: 'DELETE',
  },
  {
    label: '復元',
    operation: 'restoreWorldsendSongByDisplayId',
    url: 'http://localhost:3000/internal/worldsend-songs/A%2FB%20C/restore',
    method: 'POST',
  },
] as const) {
  test(`WORLD'S END楽曲の${label}は独立リソースのパスとHTTPメソッドを使う`, async () => {
    // Given
    const calls = installFetchRecorder(() => Response.json({ songs: [] }))
    const api = await loadSongsApi()

    // When
    if (operation === 'fetchWorldsendSongs' || operation === 'fetchManagedWorldsendSongs') {
      await api[operation]()
    } else {
      await api[operation]('A/B C')
    }

    // Then
    assert.equal(calls.length, 1)
    assert.equal(String(calls[0]?.input), url)
    assert.equal(calls[0]?.init?.method ?? 'GET', method)
  })
}

test("WORLD'S END楽曲の一括更新はPUTで空配列も送信する", async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const { updateWorldsendSongs } = await loadSongsApi()

  // When
  await updateWorldsendSongs([])

  // Then
  assert.equal(calls.length, 1)
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/worldsend-songs')
  assert.equal(calls[0]?.init?.method, 'PUT')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(calls[0]?.init?.body, '[]')
})

test("WORLD'S END楽曲の一括更新はPUTで更新内容をJSON本文に送信する", async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const { updateWorldsendSongs } = await loadSongsApi()

  // When
  await updateWorldsendSongs([
    {
      id: 'A/B C',
      title: '更新曲',
      reading: null,
      artist: 'artist',
      genre: null,
      bpm: null,
      released_at: null,
      jacket: null,
      is_new: false,
    },
  ])

  // Then
  assert.equal(calls.length, 1)
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/worldsend-songs')
  assert.equal(calls[0]?.init?.method, 'PUT')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), [
    {
      id: 'A/B C',
      title: '更新曲',
      reading: null,
      artist: 'artist',
      genre: null,
      bpm: null,
      released_at: null,
      jacket: null,
      is_new: false,
    },
  ])
})

test("WORLD'S END楽曲の新規作成はPOSTで作成内容をJSON本文に送信する", async () => {
  // Given
  const calls = installFetchRecorder(() => Response.json({ songs: [] }))
  const { createWorldsendSong } = await loadSongsApi()

  // When
  await createWorldsendSong({
    official_idx: '1',
    title: 'test',
    artist: 'artist',
    genre: 'genre',
    bpm: null,
    released_at: null,
    jacket: null,
  })

  // Then
  assert.equal(calls.length, 1)
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/worldsend-songs')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    official_idx: '1',
    title: 'test',
    artist: 'artist',
    genre: 'genre',
    bpm: null,
    released_at: null,
    jacket: null,
  })
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

test('requestMasterData は所持状況マスタをID順で受け取る', async () => {
  // Given: 順不同の所持状況マスタを含むマスターデータ。
  installFetchRecorder(() =>
    Response.json({
      genres: [],
      difficulties: [],
      versions: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
      possessions: [
        { id: 5, name: 'rainbow' },
        { id: 1, name: 'normal' },
      ],
    })
  )

  // When: マスターデータを取得する。
  const { requestMasterData } = await loadSongsApi()
  const result = await requestMasterData()

  // Then: 所持状況がID昇順で受け取れる。
  assert.equal(result.possessions.length, 2)
  assert.equal(result.possessions[0]?.name, 'normal')
  assert.equal(result.possessions[1]?.name, 'rainbow')
})

test('requestMasterData は所持状況マスタが無い場合に空配列へ正規化する', async () => {
  // Given: 所持状況を含まない旧マスターデータ。
  installFetchRecorder(() =>
    Response.json({
      genres: [],
      difficulties: [],
      versions: [],
      account_types: [],
      rating_bands: [],
      achievement_types: [],
    })
  )

  // When: マスターデータを取得する。
  const { requestMasterData } = await loadSongsApi()
  const result = await requestMasterData()

  // Then: 呼び出し側が未定義を扱わずに済む。
  assert.deepEqual(result.possessions, [])
})

test('楽曲名順フォルダはAPIの表示名を保持してsort_order順に取得する', async () => {
  // Given
  const folders = [
    { code: 'CUSTOM', name: 'APIの分類', sort_order: 20 },
    { code: 'A', name: 'APIのあ行', sort_order: 10 },
  ]
  installFetchRecorder(() => Response.json({ name_folders: folders }))
  const { requestMasterData } = await loadSongsApi()

  // When
  const result = await requestMasterData()

  // Then
  assert.deepEqual(result.name_folders, [folders[1], folders[0]])
})

test('requestSongsUpdatedAt は不正な updated_at を拒否し、HTTPキャッシュを再検証する', async () => {
  // Given: 契約に反するレスポンス。
  const { requestSongsUpdatedAt } = await loadSongsApi()
  for (const invalid of [{}, { updated_at: 123 }, { updated_at: false }, null]) {
    const calls = installFetchRecorder(() => Response.json(invalid))

    // When / Then: API層で型を検証し、HTTPキャッシュの再検証を要求する。
    await assert.rejects(requestSongsUpdatedAt(), TypeError)
    assert.equal(calls[0]?.init?.cache, 'no-cache')
  }
})
