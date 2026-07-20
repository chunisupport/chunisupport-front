import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { db } from '../../lib/db/cacheDB.ts'
import {
  clearCachedSongData,
  replaceCachedSongs,
  replaceCachedWorldsendSongs,
} from '../../repositories/songCacheRepository.ts'
import type { SongDTO, WorldsendSongDTO } from '../../types/api.ts'

const SONGS_UPDATED_AT = '2026-07-20T09:00:00Z'

const cachedSong: SongDTO = {
  id: 'cached-song',
  title: 'キャッシュ楽曲',
  reading: null,
  artist: 'キャッシュ',
  genre: 'POPS & ANIME',
  bpm: null,
  release: null,
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
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
  artist: 'キャッシュ',
  genre: 'POPS & ANIME',
  bpm: null,
  release: null,
  official_idx: '90001',
  jacket: null,
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
      import('../../api/songs.ts'),
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
  const response = await fetchAllSongsWithCache({ forceRefresh: true })

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
