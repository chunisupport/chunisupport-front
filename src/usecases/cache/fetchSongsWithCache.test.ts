import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { SONGS_UPDATED_AT_CACHE_TTL_MS } from '../../constants/songMaster.ts'
import { db } from '../../lib/db/cacheDB.ts'
import { appQueryClient } from '../../lib/queryClient'
import {
  clearCachedSongData,
  replaceCachedSongs,
  replaceCachedWorldsendSongs,
} from '../../repositories/songCacheRepository.ts'
import type { SongDTO, WorldsendSongDTO } from '../../types/api.ts'

beforeEach(() => appQueryClient.clear())

const SONGS_UPDATED_AT = '2026-07-20T09:00:00Z'
/** キャッシュ済み楽曲データの変更世代 */
const SONGS_REVISION = 128
/** 外部更新後を想定したサーバー側の楽曲データの変更世代 */
const EXTERNALLY_UPDATED_SONGS_REVISION = 129

const cachedSong: SongDTO = {
  id: 'cached-song',
  title: 'キャッシュ楽曲',
  reading: null,
  name_folder_code: 'NUMBER',
  artist: 'キャッシュ',
  genre: 'POPS & ANIME',
  bpm: null,
  release: null,
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
  unlock_required: false,
  charts: {},
}

const fetchedSong: SongDTO = {
  ...cachedSong,
  id: 'fetched-song',
  title: 'API楽曲',
}

const cachedWorldsendSong: WorldsendSongDTO = {
  id: 'cached-worldsend-song',
  title: "キャッシュWORLD'S END楽曲",
  reading: null,
  name_folder_code: 'NUMBER',
  artist: 'キャッシュ',
  genre: 'POPS & ANIME',
  bpm: null,
  release: null,
  official_idx: '90001',
  jacket: null,
  is_new: false,
  unlock_required: false,
  charts: {},
}

const fetchedWorldsendSong: WorldsendSongDTO = {
  ...cachedWorldsendSong,
  id: 'fetched-worldsend-song',
  title: "API WORLD'S END楽曲",
}

/**
 * 楽曲取得 usecase テストに必要な環境変数を設定する。
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
 * 環境変数設定後に楽曲キャッシュ usecase と更新日時無効化関数を読み込む。
 *
 * @returns テスト対象の関数群。
 */
const loadSongsCacheUsecases = async () => {
  const [{ invalidateSongsUpdatedAtCache }, { fetchAllSongsWithCache }, worldsendUsecase] =
    await Promise.all([
      import('../../queries/masterData.ts'),
      import('./fetchAllSongsWithCache.ts'),
      import('./fetchWorldsendSongsWithCache.ts'),
    ])

  return {
    fetchAllSongsWithCache,
    fetchWorldsendSongsWithCache: worldsendUsecase.fetchWorldsendSongsWithCache,
    invalidateSongsUpdatedAtCache,
  }
}

/**
 * 楽曲キャッシュと更新日時のメモリキャッシュをテストごとに初期化する。
 *
 * @returns 初期化完了後に解決される Promise。
 */
const clearSongCaches = async (): Promise<void> => {
  const { invalidateSongsUpdatedAtCache } = await loadSongsCacheUsecases()
  invalidateSongsUpdatedAtCache()
  await Promise.all([db.songs.clear(), db.worldsendSongs.clear(), db.cacheMetadata.clear()])
}

setupApiTestEnv()

afterEach(async () => {
  await clearSongCaches()
})

test('変更世代の欠落時はキャッシュを先行表示しても再検証済みとして返さないこと', async () => {
  // Given: 旧キャッシュと、変更世代を欠いた API 応答。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_REVISION)
  globalThis.fetch = async (input) =>
    Response.json(String(input).endsWith('/updated-at') ? {} : { songs: [fetchedSong] })
  const cachedResponses: SongDTO[][] = []

  // When: キャッシュの先行表示と再検証を要求する。
  const response = await fetchAllSongsWithCache({
    onCached: ({ songs }) => cachedResponses.push(songs),
  })

  // Then: 先行表示は維持し、最終結果は一覧 API から取得する。不正な応答の変更世代は保存しない。
  assert.deepEqual(cachedResponses, [[cachedSong]])
  assert.deepEqual(response.songs, [fetchedSong])
  assert.equal((await db.cacheMetadata.get('songs'))?.songsRevision, SONGS_REVISION)
})

test('通常楽曲の強制再取得はrevisionが同じでもIndexedDBキャッシュを使わないこと', async () => {
  // Given: API と同じ変更世代を持つ旧楽曲キャッシュが存在する。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_REVISION)
  let songsFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: SONGS_UPDATED_AT, revision: SONGS_REVISION })
    }
    if (url.endsWith('/internal/songs')) {
      songsFetchCount += 1
      return Response.json({ songs: [fetchedSong] })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }

  // When: CRUD 後の強制再取得を実行する。
  const response = await fetchAllSongsWithCache({
    forceRefresh: true,
    onCached: () => assert.fail('強制再取得ではキャッシュを表示しない'),
  })

  // Then: 一覧 API の正規 DTO を返し、IndexedDB も置き換える。
  assert.equal(songsFetchCount, 1)
  assert.deepEqual(response.songs, [fetchedSong])
  assert.deepEqual(await db.songs.toArray(), [
    { id: fetchedSong.id, sortOrder: 0, data: fetchedSong },
  ])
})

test("WORLD'S END楽曲の強制再取得はrevisionが同じでもキャッシュを使わないこと", async () => {
  // Given: API と同じ変更世代を持つ旧楽曲キャッシュが存在する。
  const { fetchWorldsendSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedWorldsendSongs([cachedWorldsendSong], SONGS_REVISION)
  let songsFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: SONGS_UPDATED_AT, revision: SONGS_REVISION })
    }
    if (url.endsWith('/internal/worldsend-songs')) {
      songsFetchCount += 1
      return Response.json({ songs: [fetchedWorldsendSong] })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }

  // When: CRUD 後の強制再取得を実行する。
  const response = await fetchWorldsendSongsWithCache({ forceRefresh: true })

  // Then: 一覧 API の正規 DTO を返し、IndexedDB も置き換える。
  assert.equal(songsFetchCount, 1)
  assert.deepEqual(response.songs, [fetchedWorldsendSong])
  assert.deepEqual(await db.worldsendSongs.toArray(), [
    { id: fetchedWorldsendSong.id, sortOrder: 0, data: fetchedWorldsendSong },
  ])
})

test('無効化前に開始した通常楽曲取得は完了後に旧データをキャッシュへ書き戻さないこと', async () => {
  // Given: CRUD 前の一覧 API リクエストを応答待ちにする。
  const { fetchAllSongsWithCache, invalidateSongsUpdatedAtCache } = await loadSongsCacheUsecases()
  let resolveSongsResponse!: (response: Response) => void
  let notifySongsRequestStarted!: () => void
  const songsRequestStarted = new Promise<void>((resolve) => {
    notifySongsRequestStarted = resolve
  })
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: SONGS_UPDATED_AT, revision: SONGS_REVISION })
    }
    if (url.endsWith('/internal/songs')) {
      notifySongsRequestStarted()
      return new Promise<Response>((resolve) => {
        resolveSongsResponse = resolve
      })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const staleRequest = fetchAllSongsWithCache({ forceRefresh: true })
  await songsRequestStarted

  // When: CRUD 後の無効化を行ってから、古い一覧 API 応答を解決する。
  invalidateSongsUpdatedAtCache()
  await clearCachedSongData()
  resolveSongsResponse(Response.json({ songs: [cachedSong] }))
  await staleRequest

  // Then: 取得呼び出し自体は完了しても、無効化済み世代の DTO は保存されない。
  assert.equal(await db.songs.count(), 0)
  assert.equal(await db.cacheMetadata.get('songs'), undefined)
})

test('楽曲更新日時APIの失敗時は一覧DTOを返してIndexedDBを更新しないこと', async () => {
  // Given: 更新日時 API だけが失敗し、通常楽曲一覧 API は成功する。
  const { fetchAllSongsWithCache, invalidateSongsUpdatedAtCache } = await loadSongsCacheUsecases()
  invalidateSongsUpdatedAtCache()
  await clearCachedSongData()
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      throw new Error('updated-at unavailable')
    }
    if (url.endsWith('/internal/songs')) {
      return Response.json({ songs: [fetchedSong] })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }

  // When: キャッシュ付き取得を実行する。
  const response = await fetchAllSongsWithCache()

  // Then: API DTO は利用できるが、更新日時不明のデータは保存しない。
  assert.deepEqual(response.songs, [fetchedSong])
  assert.equal(await db.songs.count(), 0)
  assert.equal(await db.cacheMetadata.get('songs'), undefined)
})

/** TTL 経過後の再検証テストで共通化する、楽曲種別ごとのテスト対象 */
const revalidationTargets = [
  {
    label: '通常楽曲',
    songsPath: '/internal/songs',
    cachedSong,
    fetchedSong,
    fetchWithCache: async () => (await loadSongsCacheUsecases()).fetchAllSongsWithCache(),
    replaceCache: (revision: number) => replaceCachedSongs([cachedSong], revision),
  },
  {
    label: "WORLD'S END楽曲",
    songsPath: '/internal/worldsend-songs',
    cachedSong: cachedWorldsendSong,
    fetchedSong: fetchedWorldsendSong,
    fetchWithCache: async () => (await loadSongsCacheUsecases()).fetchWorldsendSongsWithCache(),
    replaceCache: (revision: number) =>
      replaceCachedWorldsendSongs([cachedWorldsendSong], revision),
  },
] as const

/**
 * 楽曲更新日時 API と楽曲一覧 API を差し替え、呼び出し回数を記録する。
 * 更新日時は固定し、変更世代だけを変えて世代の一致で判定することを検証する。
 *
 * @param songsPath - 楽曲一覧 API のパス。
 * @param getRevision - 呼び出し時点でサーバーが返す楽曲データの変更世代。
 * @param songs - 楽曲一覧 API が返す楽曲。
 * @returns 楽曲一覧 API と楽曲更新日時 API の呼び出し回数を返す関数。
 */
const installSongsApi = (
  songsPath: string,
  getRevision: () => number,
  songs: unknown[]
): { getSongsFetchCount: () => number; getUpdatedAtFetchCount: () => number } => {
  let songsFetchCount = 0
  let updatedAtFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      updatedAtFetchCount += 1
      return Response.json({ updated_at: SONGS_UPDATED_AT, revision: getRevision() })
    }
    if (url.endsWith(songsPath)) {
      songsFetchCount += 1
      return Response.json({ songs })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
  return {
    getSongsFetchCount: () => songsFetchCount,
    getUpdatedAtFetchCount: () => updatedAtFetchCount,
  }
}

for (const target of revalidationTargets) {
  test(`${target.label}はTTL経過後に外部更新を検知して旧IndexedDBキャッシュを返さないこと`, async (t) => {
    // Given: 変更世代 R1 で楽曲キャッシュとメモリ上の変更世代が揃っている。
    t.mock.timers.enable({ apis: ['Date'], now: 0 })
    await target.replaceCache(SONGS_REVISION)
    let serverRevision = SONGS_REVISION
    const { getSongsFetchCount } = installSongsApi(target.songsPath, () => serverRevision, [
      target.fetchedSong,
    ])
    const beforeUpdate = await target.fetchWithCache()

    // When: 同じ秒内の外部更新で更新日時は変わらず変更世代だけ R2 に進み、TTL 経過後に再度取得する。
    serverRevision = EXTERNALLY_UPDATED_SONGS_REVISION
    t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS)
    const afterUpdate = await target.fetchWithCache()

    // Then: 初回は R1 のキャッシュを返し、TTL 経過後は API から最新一覧を取得する。
    assert.deepEqual(beforeUpdate.songs, [target.cachedSong])
    assert.deepEqual(afterUpdate.songs, [target.fetchedSong])
    assert.equal(getSongsFetchCount(), 1)
  })

  test(`${target.label}はTTL直前まで更新日時を再取得せず、ちょうどTTLで再取得してもIndexedDBキャッシュを再利用すること`, async (t) => {
    // Given: 変更世代 R1 で楽曲キャッシュとメモリ上の変更世代が揃っている。
    t.mock.timers.enable({ apis: ['Date'], now: 0 })
    await target.replaceCache(SONGS_REVISION)
    const { getSongsFetchCount, getUpdatedAtFetchCount } = installSongsApi(
      target.songsPath,
      () => SONGS_REVISION,
      [target.fetchedSong]
    )
    await target.fetchWithCache()

    // When: サーバー側の更新がないまま TTL の 1ms 前に再度取得する。
    t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS - 1)
    const beforeTtl = await target.fetchWithCache()

    // Then: 更新日時 API は初回の 1 回だけで、IndexedDB キャッシュを返す。
    assert.deepEqual(beforeTtl.songs, [target.cachedSong])
    assert.equal(getUpdatedAtFetchCount(), 1)

    // When: ちょうど TTL に達した時点で再度取得する。
    t.mock.timers.tick(1)
    const atTtl = await target.fetchWithCache()

    // Then: 更新日時 API だけを再取得し、楽曲一覧 API は呼ばず IndexedDB キャッシュを返す。
    assert.deepEqual(atTtl.songs, [target.cachedSong])
    assert.equal(getUpdatedAtFetchCount(), 2)
    assert.equal(getSongsFetchCount(), 0)
  })
}

test('更新日時の応答前にキャッシュを通知し、外部更新後の一覧に差し替えること', async () => {
  // Given: 古いキャッシュがあり、更新日時 API の応答は保留されている。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_REVISION)
  let resolveUpdatedAt!: (response: Response) => void
  const updatedAtResponse = new Promise<Response>((resolve) => {
    resolveUpdatedAt = resolve
  })
  globalThis.fetch = async (input) =>
    String(input).endsWith('/updated-at')
      ? updatedAtResponse
      : Response.json({ songs: [fetchedSong] })
  let notifyCached!: (songs: SongDTO[]) => void
  const cacheNotification = new Promise<SongDTO[]>((resolve) => {
    notifyCached = resolve
  })

  // When: 更新日時の応答を待たず、キャッシュの先行通知を受け取る。
  const request = fetchAllSongsWithCache({ onCached: ({ songs }) => notifyCached(songs) })
  assert.deepEqual(await cacheNotification, [cachedSong])
  resolveUpdatedAt(
    Response.json({ updated_at: SONGS_UPDATED_AT, revision: EXTERNALLY_UPDATED_SONGS_REVISION })
  )

  // Then: 最終応答と IndexedDB は外部更新後の楽曲になる。
  assert.deepEqual((await request).songs, [fetchedSong])
  assert.deepEqual(
    (await db.songs.toArray()).map((song) => song.data),
    [fetchedSong]
  )
})

test('キャッシュなしでは更新日時の応答を待たずに楽曲一覧を取得すること', async () => {
  // Given: キャッシュがなく、更新日時 API は保留されている。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  let resolveUpdatedAt!: (response: Response) => void
  let notifySongsRequest!: () => void
  const updatedAtResponse = new Promise<Response>((resolve) => {
    resolveUpdatedAt = resolve
  })
  const songsRequested = new Promise<void>((resolve) => {
    notifySongsRequest = resolve
  })
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/updated-at')) return updatedAtResponse
    notifySongsRequest()
    return Response.json({ songs: [fetchedSong] })
  }

  // When: 更新日時を返す前に一覧リクエストの開始を確認する。
  const request = fetchAllSongsWithCache()
  await songsRequested
  resolveUpdatedAt(Response.json({ updated_at: SONGS_UPDATED_AT, revision: SONGS_REVISION }))

  // Then: 一覧を取得して保存できる。
  assert.deepEqual((await request).songs, [fetchedSong])
  assert.equal(await db.songs.count(), 1)
})

test('並列取得した一覧に後から確定した変更世代を付けず、次回に再検証すること', async () => {
  // Given: 一覧が古い内容を返した後、変更世代は新しい値を返す。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  let resolveUpdatedAt!: (response: Response) => void
  let notifySongsResponse!: () => void
  const updatedAtResponse = new Promise<Response>((resolve) => {
    resolveUpdatedAt = resolve
  })
  const songsResponded = new Promise<void>((resolve) => {
    notifySongsResponse = resolve
  })
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/updated-at')) return updatedAtResponse
    notifySongsResponse()
    return Response.json({ songs: [cachedSong] })
  }

  // When: 一覧の取得後に変更世代を確定する。
  const initialRequest = fetchAllSongsWithCache()
  await songsResponded
  resolveUpdatedAt(
    Response.json({ updated_at: SONGS_UPDATED_AT, revision: EXTERNALLY_UPDATED_SONGS_REVISION })
  )
  await initialRequest

  // Then: 未確認のキャッシュとして保存され、同じ変更世代でも最新一覧を取り直す。
  assert.equal((await db.cacheMetadata.get('songs'))?.songsRevision, undefined)
  globalThis.fetch = async () => Response.json({ songs: [fetchedSong] })
  assert.deepEqual((await fetchAllSongsWithCache()).songs, [fetchedSong])
  assert.equal(
    (await db.cacheMetadata.get('songs'))?.songsRevision,
    EXTERNALLY_UPDATED_SONGS_REVISION
  )
})

test('変更世代を保存していない旧形式のキャッシュは更新日時が一致しても再取得して移行すること', async () => {
  // Given: 更新日時だけを持つ旧形式のメタデータで楽曲キャッシュが保存されている。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], undefined)
  await db.cacheMetadata.update('songs', { songsUpdatedAt: SONGS_UPDATED_AT } as never)
  const { getSongsFetchCount } = installSongsApi('/internal/songs', () => SONGS_REVISION, [
    fetchedSong,
  ])

  // When: 同じ更新日時を返す API に対してキャッシュ付き取得を行う。
  const response = await fetchAllSongsWithCache()

  // Then: 一覧を再取得し、変更世代付きのキャッシュへ置き換える。
  assert.deepEqual(response.songs, [fetchedSong])
  assert.equal(getSongsFetchCount(), 1)
  assert.equal((await db.cacheMetadata.get('songs'))?.songsRevision, SONGS_REVISION)
})

test("変更世代を保存していない旧形式のWORLD'S ENDキャッシュは再取得して移行すること", async () => {
  // Given: 更新日時だけを持つ旧形式のメタデータで WORLD'S END 楽曲キャッシュが保存されている。
  const { fetchWorldsendSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedWorldsendSongs([cachedWorldsendSong], SONGS_REVISION)
  await db.cacheMetadata.update('worldsendSongs', {
    songsRevision: undefined,
    songsUpdatedAt: SONGS_UPDATED_AT,
  } as never)
  const { getSongsFetchCount } = installSongsApi(
    '/internal/worldsend-songs',
    () => SONGS_REVISION,
    [fetchedWorldsendSong]
  )

  // When: 同じ更新日時を返す API に対してキャッシュ付き取得を行う。
  const response = await fetchWorldsendSongsWithCache()

  // Then: 一覧を再取得し、変更世代付きのキャッシュへ置き換える。
  assert.deepEqual(response.songs, [fetchedWorldsendSong])
  assert.equal(getSongsFetchCount(), 1)
  assert.equal((await db.cacheMetadata.get('worldsendSongs'))?.songsRevision, SONGS_REVISION)
})
