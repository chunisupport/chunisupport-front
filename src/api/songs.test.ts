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
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://help.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
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
