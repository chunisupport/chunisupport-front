import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  type CachedSong,
  CLIENT_CACHE_SCHEMA_VERSION,
  db,
  type UserApiResponse,
  type ViewSetting,
} from '../lib/db/cacheDB.ts'
import type { SongDTO, UserRatingDTO, UserRecordDTO } from '../types/api.ts'
import { readCachedSongs, replaceCachedSongs } from './songCacheRepository.ts'
import {
  clearCachedUserApiResponses,
  readCachedStandardSongRecord,
  readCachedUserRating,
  readCachedUserRecord,
  readCachedWorldsendSongRecord,
  saveCachedUserRating,
  saveCachedUserRecord,
  saveCachedWorldsendSongRecord,
} from './userApiCacheRepository.ts'
import {
  readStandardRecordColumnsSetting,
  readStandardRecordFilterSetting,
  saveStandardRecordColumnsSetting,
} from './viewSettingsRepository.ts'

const song: SongDTO = {
  id: 'song-1',
  title: 'テスト楽曲',
  reading: null,
  artist: 'テスト',
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

const previousIdSong: SongDTO = {
  ...song,
  id: 'song-0',
  title: '前方ID楽曲',
}

const rating = {
  rating: 17.1234,
  best_average: 17.2345,
  new_average: 16.9567,
  best: [],
  best_candidate: [],
  new: [],
  new_candidate: [],
  meta: { updated_at: '2026-06-16T12:00:00Z' },
} satisfies UserRatingDTO

const record = {
  standard: [],
  worldsend: [],
  meta: { updated_at: '2026-06-16T12:00:00Z' },
} satisfies UserRecordDTO

/**
 * テストごとに IndexedDB キャッシュ store を空に戻す。
 *
 * @returns 初期化完了後に解決される Promise。
 */
const clearStores = async (): Promise<void> => {
  await Promise.all([
    db.cacheMetadata.clear(),
    db.songs.clear(),
    db.worldsendSongs.clear(),
    db.userSongRecords.clear(),
    db.userApiResponses.clear(),
    db.viewSettings.clear(),
  ])
}

afterEach(async () => {
  await clearStores()
})

test('楽曲キャッシュは schemaVersion と updated-at が一致する場合だけ読み込まれること', async () => {
  // Given
  await replaceCachedSongs([song, previousIdSong], '2026-06-16T12:00:00Z')

  // When
  const matched = await readCachedSongs('2026-06-16T12:00:00Z')
  const mismatched = await readCachedSongs('2026-06-16T12:01:00Z')

  // Then
  assert.deepEqual(matched, [song, previousIdSong])
  assert.equal(mismatched, null)
})

test('楽曲キャッシュは順序情報がない旧形式の場合は読み込まれないこと', async () => {
  // Given
  await db.cacheMetadata.put({
    key: 'songs',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    songsUpdatedAt: '2026-06-16T12:00:00Z',
    fetchedAt: '2026-06-16T12:00:00Z',
  })
  await db.songs.put({
    id: song.id,
    data: song,
  } as CachedSong)

  // When
  const cachedSongs = await readCachedSongs('2026-06-16T12:00:00Z')

  // Then
  assert.equal(cachedSongs, null)
})

test('ユーザー API キャッシュは username と updated-at が一致する場合だけ読み込まれること', async () => {
  // Given
  await saveCachedUserRating('alice', 'user-1', 'songs-1', rating)
  await saveCachedUserRecord('alice', 'user-1', 'songs-1', record)

  // When
  const matchedRating = await readCachedUserRating({
    username: 'alice',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  })
  const mismatchedRating = await readCachedUserRating({
    username: 'bob',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  })
  const matchedRecord = await readCachedUserRecord({
    username: 'alice',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  })
  const mismatchedRecord = await readCachedUserRecord({
    username: 'bob',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  })

  // Then
  assert.deepEqual(matchedRating, rating)
  assert.equal(mismatchedRating, null)
  assert.deepEqual(matchedRecord, record)
  assert.equal(mismatchedRecord, null)
})

test('全件レコードキャッシュは曲単位に分割して保存されること', async () => {
  // Given
  const songRecord = {
    is_played: true,
    is_op_target: true,
    updated_at: '2026-06-16T12:00:00Z',
    difficulty: 'MASTER',
    id: 'song-1',
    title: 'テスト楽曲',
    artist: 'テスト',
    const: 14.5,
    is_const_unknown: false,
    score: 1_009_500,
    rating: 17.14,
    overpower: 5.67,
    justice_count: null,
    overpower_percent: 98.2857,
    img: '',
    clear_lamp: 'CLEAR',
    combo_lamp: 'FULL COMBO',
    full_chain: null,
    slot: 'best',
  } as const
  await saveCachedUserRecord('alice', 'user-1', 'songs-1', {
    standard: [songRecord],
    worldsend: [],
    meta: { updated_at: '2026-06-16T12:00:00Z' },
  })

  // When
  const cached = await readCachedStandardSongRecord(
    {
      username: 'alice',
      userUpdatedAt: 'user-1',
      songsUpdatedAt: 'songs-1',
    },
    'song-1'
  )

  // Then
  assert.deepEqual(cached, [songRecord])
  assert.equal(await db.userApiResponses.count(), 0)
})

test("WORLD'S END未プレイはキャッシュなしと区別して保存されること", async () => {
  // Given
  const match = {
    username: 'alice',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  }
  await saveCachedWorldsendSongRecord(match, 'worldsend-1', null)

  // When
  const cachedNoPlay = await readCachedWorldsendSongRecord(match, 'worldsend-1')
  const missing = await readCachedWorldsendSongRecord(match, 'worldsend-2')

  // Then
  assert.equal(cachedNoPlay, null)
  assert.equal(missing, undefined)
})

test('ユーザーAPIキャッシュの全削除はレーティング・曲別レコード・全件メタデータを削除すること', async () => {
  // Given
  await saveCachedUserRating('alice', 'user-1', 'songs-1', rating)
  await saveCachedUserRecord('alice', 'user-1', 'songs-1', record)
  await saveCachedWorldsendSongRecord(
    {
      username: 'alice',
      userUpdatedAt: 'user-1',
      songsUpdatedAt: 'songs-1',
    },
    'worldsend-1',
    null
  )

  // When
  await clearCachedUserApiResponses()

  // Then
  assert.equal(await db.userApiResponses.count(), 0)
  assert.equal(await db.userSongRecords.count(), 0)
  assert.equal(await db.cacheMetadata.get('userRecord'), undefined)
})

test('集計値がない旧形式のレーティングキャッシュは読み込まれないこと', async () => {
  // Given
  await db.userApiResponses.put({
    key: 'userRating',
    username: 'alice',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
    fetchedAt: new Date().toISOString(),
    data: {
      best: [],
      best_candidate: [],
      new: [],
      new_candidate: [],
      meta: { updated_at: '2026-06-16T12:00:00Z' },
    },
  } as unknown as UserApiResponse)

  // When
  const cachedRating = await readCachedUserRating({
    username: 'alice',
    userUpdatedAt: 'user-1',
    songsUpdatedAt: 'songs-1',
  })

  // Then
  assert.equal(cachedRating, null)
})

test('画面設定は現行 schemaVersion の保存値だけ読み込まれること', async () => {
  // Given
  await saveStandardRecordColumnsSetting(['title', 'score'])
  await db.viewSettings.put({
    key: 'standardRecordFilter',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION - 1,
    savedAt: '2026-06-16T12:00:00Z',
    data: { title: 'old' },
  } as unknown as ViewSetting)

  // When
  const columns = await readStandardRecordColumnsSetting()
  const filter = await readStandardRecordFilterSetting()

  // Then
  assert.deepEqual(columns, ['title', 'score'])
  assert.equal(filter, null)
})
