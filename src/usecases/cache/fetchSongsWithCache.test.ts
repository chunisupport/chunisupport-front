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
/** 外部更新後を想定したサーバー側の楽曲更新日時 */
const EXTERNALLY_UPDATED_SONGS_UPDATED_AT = '2026-08-03T09:00:00Z'

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

test('更新日時の欠落時はキャッシュを先行表示しても再検証済みとして返さないこと', async () => {
  // Given: 旧キャッシュと、更新日時を欠いた API 応答。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_UPDATED_AT)
  globalThis.fetch = async (input) =>
    Response.json(String(input).endsWith('/updated-at') ? {} : { songs: [fetchedSong] })
  const cachedResponses: SongDTO[][] = []

  // When: キャッシュの先行表示と再検証を要求する。
  const response = await fetchAllSongsWithCache({
    onCached: ({ songs }) => cachedResponses.push(songs),
  })

  // Then: 先行表示は維持し、最終結果は一覧 API から取得する。不正日時は保存しない。
  assert.deepEqual(cachedResponses, [[cachedSong]])
  assert.deepEqual(response.songs, [fetchedSong])
  assert.equal((await db.cacheMetadata.get('songs'))?.songsUpdatedAt, SONGS_UPDATED_AT)
})

test('通常楽曲の強制再取得はupdated-atが同じでもIndexedDBキャッシュを使わないこと', async () => {
  // Given: API と同じ更新日時を持つ旧楽曲キャッシュが存在する。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_UPDATED_AT)
  let songsFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: SONGS_UPDATED_AT })
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

test("WORLD'S END楽曲の強制再取得はupdated-atが同じでもキャッシュを使わないこと", async () => {
  // Given: API と同じ更新日時を持つ旧楽曲キャッシュが存在する。
  const { fetchWorldsendSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedWorldsendSongs([cachedWorldsendSong], SONGS_UPDATED_AT)
  let songsFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: SONGS_UPDATED_AT })
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
      return Response.json({ updated_at: SONGS_UPDATED_AT })
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
    replaceCache: (updatedAt: string) => replaceCachedSongs([cachedSong], updatedAt),
  },
  {
    label: "WORLD'S END楽曲",
    songsPath: '/internal/worldsend-songs',
    cachedSong: cachedWorldsendSong,
    fetchedSong: fetchedWorldsendSong,
    fetchWithCache: async () => (await loadSongsCacheUsecases()).fetchWorldsendSongsWithCache(),
    replaceCache: (updatedAt: string) =>
      replaceCachedWorldsendSongs([cachedWorldsendSong], updatedAt),
  },
] as const

/**
 * 楽曲更新日時 API と楽曲一覧 API を差し替え、呼び出し回数を記録する。
 *
 * @param songsPath - 楽曲一覧 API のパス。
 * @param getUpdatedAt - 呼び出し時点でサーバーが返す楽曲更新日時。
 * @param songs - 楽曲一覧 API が返す楽曲。
 * @returns 楽曲一覧 API の呼び出し回数を返す関数。
 */
const installSongsApi = (
  songsPath: string,
  getUpdatedAt: () => string,
  songs: unknown[]
): (() => number) => {
  let songsFetchCount = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/internal/songs/updated-at')) {
      return Response.json({ updated_at: getUpdatedAt() })
    }
    if (url.endsWith(songsPath)) {
      songsFetchCount += 1
      return Response.json({ songs })
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
  return () => songsFetchCount
}

for (const target of revalidationTargets) {
  test(`${target.label}はTTL経過後に外部更新を検知して旧IndexedDBキャッシュを返さないこと`, async (t) => {
    // Given: 更新日時 T1 で楽曲キャッシュとメモリ上の更新日時が揃っている。
    t.mock.timers.enable({ apis: ['Date'], now: 0 })
    await target.replaceCache(SONGS_UPDATED_AT)
    let serverUpdatedAt = SONGS_UPDATED_AT
    const getSongsFetchCount = installSongsApi(target.songsPath, () => serverUpdatedAt, [
      target.fetchedSong,
    ])
    const beforeUpdate = await target.fetchWithCache()

    // When: 外部経路で T2 に更新され、TTL 経過後に再度キャッシュ付き取得を行う。
    serverUpdatedAt = EXTERNALLY_UPDATED_SONGS_UPDATED_AT
    t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS)
    const afterUpdate = await target.fetchWithCache()

    // Then: 初回は T1 のキャッシュを返し、TTL 経過後は API から最新一覧を取得する。
    assert.deepEqual(beforeUpdate.songs, [target.cachedSong])
    assert.deepEqual(afterUpdate.songs, [target.fetchedSong])
    assert.equal(getSongsFetchCount(), 1)
  })

  test(`${target.label}はTTL経過後も更新日時が同じならIndexedDBキャッシュを再利用すること`, async (t) => {
    // Given: 更新日時 T1 で楽曲キャッシュとメモリ上の更新日時が揃っている。
    t.mock.timers.enable({ apis: ['Date'], now: 0 })
    await target.replaceCache(SONGS_UPDATED_AT)
    const getSongsFetchCount = installSongsApi(target.songsPath, () => SONGS_UPDATED_AT, [
      target.fetchedSong,
    ])
    await target.fetchWithCache()

    // When: サーバー側の更新がないまま TTL 経過後に再度取得する。
    t.mock.timers.tick(SONGS_UPDATED_AT_CACHE_TTL_MS)
    const response = await target.fetchWithCache()

    // Then: 楽曲一覧 API は呼ばず、IndexedDB キャッシュを返す。
    assert.deepEqual(response.songs, [target.cachedSong])
    assert.equal(getSongsFetchCount(), 0)
  })
}

test('更新日時の応答前にキャッシュを通知し、外部更新後の一覧に差し替えること', async () => {
  // Given: 古いキャッシュがあり、更新日時 API の応答は保留されている。
  const { fetchAllSongsWithCache } = await loadSongsCacheUsecases()
  await replaceCachedSongs([cachedSong], SONGS_UPDATED_AT)
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
  resolveUpdatedAt(Response.json({ updated_at: EXTERNALLY_UPDATED_SONGS_UPDATED_AT }))

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
  resolveUpdatedAt(Response.json({ updated_at: SONGS_UPDATED_AT }))

  // Then: 一覧を取得して保存できる。
  assert.deepEqual((await request).songs, [fetchedSong])
  assert.equal(await db.songs.count(), 1)
})

test('並列取得した一覧に後から確定した更新日時を付けず、次回に再検証すること', async () => {
  // Given: 一覧が古い内容を返した後、更新日時は新しい値を返す。
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

  // When: 一覧の取得後に更新日時を確定する。
  const initialRequest = fetchAllSongsWithCache()
  await songsResponded
  resolveUpdatedAt(Response.json({ updated_at: EXTERNALLY_UPDATED_SONGS_UPDATED_AT }))
  await initialRequest

  // Then: 未確認のキャッシュとして保存され、同じ更新日時でも最新一覧を取り直す。
  assert.equal((await db.cacheMetadata.get('songs'))?.songsUpdatedAt, undefined)
  globalThis.fetch = async () => Response.json({ songs: [fetchedSong] })
  assert.deepEqual((await fetchAllSongsWithCache()).songs, [fetchedSong])
  assert.equal(
    (await db.cacheMetadata.get('songs'))?.songsUpdatedAt,
    EXTERNALLY_UPDATED_SONGS_UPDATED_AT
  )
})
