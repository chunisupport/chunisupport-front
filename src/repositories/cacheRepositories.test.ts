import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { type CachedSong, CLIENT_CACHE_SCHEMA_VERSION, db } from '../lib/db/cacheDB.ts'
import type { SongDTO, UserRatingDTO, UserRecordDTO } from '../types/api.ts'
import { readCachedSongs, replaceCachedSongs } from './songCacheRepository.ts'
import {
  readCachedUserRating,
  readCachedUserRecord,
  saveCachedUserRating,
  saveCachedUserRecord,
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
  charts: {},
}

const previousIdSong: SongDTO = {
  ...song,
  id: 'song-0',
  title: '前方ID楽曲',
}

const rating = {
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

  // Then
  assert.deepEqual(matchedRating, rating)
  assert.equal(mismatchedRating, null)
  assert.deepEqual(matchedRecord, record)
})

test('画面設定は現行 schemaVersion の保存値だけ読み込まれること', async () => {
  // Given
  await saveStandardRecordColumnsSetting(['title', 'score'])
  await db.viewSettings.put({
    key: 'standardRecordFilter',
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION - 1,
    savedAt: '2026-06-16T12:00:00Z',
    data: { title: 'old' },
  })

  // When
  const columns = await readStandardRecordColumnsSetting()
  const filter = await readStandardRecordFilterSetting()

  // Then
  assert.deepEqual(columns, ['title', 'score'])
  assert.equal(filter, null)
})
