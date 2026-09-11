import assert from 'node:assert/strict'
import test from 'node:test'
import { setupTestEnvironment } from '../test/setupTestEnvironment'

/**
 * フレンドランキングquery moduleを環境設定後に読み込む。
 *
 * @returns フレンドランキングquery module。
 */
const loadFriendRankingsQuery = async () => {
  setupTestEnvironment()
  return import('./friendRankings.ts')
}

test('フレンドランキングquery keyは認証ユーザーと譜面種別で分離される', async () => {
  // Given: 2ユーザーと通常譜面、WORLD'S END譜面。
  const { friendRankingQueryKeys } = await loadFriendRankingsQuery()

  // When: 各query keyを生成する。
  const aliceSong = friendRankingQueryKeys.song('alice', 'song-1', 'MASTER')
  const bobSong = friendRankingQueryKeys.song('bob', 'song-1', 'MASTER')
  const worldsend = friendRankingQueryKeys.worldsend('alice', 'we-1')

  // Then: ユーザーと譜面種別ごとに異なるkeyになる。
  assert.notDeepEqual(aliceSong, bobSong)
  assert.notDeepEqual(aliceSong, worldsend)
})

test('通常譜面ランキングquery optionsは難易度を大文字でkeyへ格納する', async () => {
  // Given: 小文字として渡された外部入力相当の難易度。
  const { songFriendRankingQueryOptions } = await loadFriendRankingsQuery()

  // When: query optionsを生成する。
  const options = songFriendRankingQueryOptions('alice', 'song-1', 'ultima' as never)

  // Then: keyには大文字のドメイン値が入る。
  assert.deepEqual(options.queryKey, ['friend-rankings', 'alice', 'song', 'song-1', 'ULTIMA'])
})

test('認証情報がないランキングqueryは自動取得しない', async () => {
  // Given: 未認証状態。
  const { songFriendRankingQueryOptions, worldsendFriendRankingQueryOptions } =
    await loadFriendRankingsQuery()

  // When: query optionsを生成する。
  const songOptions = songFriendRankingQueryOptions(null, 'song-1', 'MASTER')
  const worldsendOptions = worldsendFriendRankingQueryOptions(null, 'we-1')

  // Then: どちらもdisabledになる。
  assert.equal(songOptions.enabled, false)
  assert.equal(worldsendOptions.enabled, false)
})
