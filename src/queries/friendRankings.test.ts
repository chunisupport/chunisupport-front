import assert from 'node:assert/strict'
import test from 'node:test'
import { loadTestModule } from '../test/setupTestEnvironment'

/**
 * フレンドランキングquery moduleを環境設定後に読み込む。
 * @returns フレンドランキングquery module。
 */
const loadFriendRankingsQuery = () => loadTestModule(() => import('./friendRankings.ts'))

test('フレンドランキングquery keyは認証ユーザーと対象種別で分離される', async () => {
  // Given: 2ユーザーと通常譜面、WORLD'S END譜面、コース。
  const { friendRankingQueryKeys } = await loadFriendRankingsQuery()

  // When: 各query keyを生成する。
  const aliceSong = friendRankingQueryKeys.song('alice', 'song-1', 'MASTER')
  const bobSong = friendRankingQueryKeys.song('bob', 'song-1', 'MASTER')
  const worldsend = friendRankingQueryKeys.worldsend('alice', 'song-1')

  const aliceCourse = friendRankingQueryKeys.course('alice', 'song-1')

  // Then: ユーザーと対象種別ごとに異なるkeyになり、フレンド変更時の無効化範囲に入る。
  assert.notDeepEqual(aliceSong, bobSong)
  assert.notDeepEqual(aliceSong, worldsend)
  assert.notDeepEqual(aliceCourse, aliceSong)
  assert.notDeepEqual(aliceCourse, worldsend)
  assert.deepEqual(aliceCourse, [...friendRankingQueryKeys.user('alice'), 'course', 'song-1'])
  assert.deepEqual(aliceSong, ['friend-rankings', 'alice', 'song', 'song-1', 'MASTER'])
  assert.deepEqual(worldsend, ['friend-rankings', 'alice', 'worldsend', 'song-1'])
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
