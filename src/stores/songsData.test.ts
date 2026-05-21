import assert from 'node:assert/strict'
import { test } from 'node:test'

/**
 * テスト用のAPI環境変数を設定して、ソート関数を遅延読み込みする。
 *
 * @returns 楽曲追加日ソート関数。
 */
const loadSortSongsByAddedDateAndOfficialIndex = async () => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'

  const { sortSongsByAddedDateAndOfficialIndex } = await import('./songsData.ts')
  return sortSongsByAddedDateAndOfficialIndex
}

test('追加日を優先し、同日内はofficial_idxを数値昇順でソートする', async () => {
  const sortSongsByAddedDateAndOfficialIndex = await loadSortSongsByAddedDateAndOfficialIndex()
  const songs = [
    { title: 'C', release: '2024-01-02', official_idx: '10' },
    { title: 'A', release: '2024-01-01', official_idx: '2' },
    { title: 'B', release: '2024-01-01', official_idx: '11' },
    { title: 'D', release: '2024-01-03', official_idx: '1' },
  ]

  const sorted = sortSongsByAddedDateAndOfficialIndex(songs)

  assert.deepEqual(
    sorted.map((song) => song.title),
    ['A', 'B', 'C', 'D']
  )
})

test('official_idxが非数値の場合は同日の末尾に寄せる', async () => {
  const sortSongsByAddedDateAndOfficialIndex = await loadSortSongsByAddedDateAndOfficialIndex()
  const songs = [
    { title: '数値あり', release: '2024-01-01', official_idx: '3' },
    { title: '非数値', release: '2024-01-01', official_idx: 'X3' },
    { title: '空文字', release: '2024-01-01', official_idx: '' },
  ]

  const sorted = sortSongsByAddedDateAndOfficialIndex(songs)

  assert.deepEqual(
    sorted.map((song) => song.title),
    ['数値あり', '空文字', '非数値']
  )
})

test('releaseが不正または未設定の曲は末尾へ寄せる', async () => {
  const sortSongsByAddedDateAndOfficialIndex = await loadSortSongsByAddedDateAndOfficialIndex()
  const songs = [
    { title: '日付あり', release: '2024-01-01', official_idx: '2' },
    { title: '日付なし', release: null, official_idx: '1' },
    { title: '不正日付', release: 'invalid', official_idx: '1' },
  ]

  const sorted = sortSongsByAddedDateAndOfficialIndex(songs)

  assert.equal(sorted[0].title, '日付あり')
  assert.deepEqual(
    sorted
      .slice(1)
      .map((song) => song.title)
      .sort(),
    ['不正日付', '日付なし']
  )
})
