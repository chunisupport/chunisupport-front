import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../../../test/setupTestEnvironment'

/**
 * 認証済みの目標一覧データ取得処理を読み込む。
 * @returns テスト対象のデータ取得モジュール。
 */
const loadGoalsListResource = () =>
  loadTestModule((cacheKey) => import(`./goalsListResource.ts?cache=${cacheKey}`), {
    authenticate: true,
  })

/**
 * 目標一覧が利用するAPIの応答と呼び出し履歴を用意する。
 * @param hasPlayer - プレイヤー登録の有無。
 * @param lockedSongsStatus - 未解禁曲一覧APIのHTTPステータス。
 * @returns 記録されたfetch呼び出し。
 */
const installGoalsFetch = (hasPlayer: boolean, lockedSongsStatus = 200) =>
  installFetchRecorder((input) => {
    const path = new URL(String(input)).pathname
    switch (path) {
      case '/internal/me':
        return Response.json({ username: 'test-user' })
      case '/internal/users/test-user/profile':
        return Response.json({ player: hasPlayer ? { name: 'PLAYER' } : null })
      case '/internal/me/goals':
        return Response.json({ goals: [] })
      case '/internal/me/goal-groups':
        return Response.json({ groups: [] })
      case '/internal/songs':
        return Response.json({ songs: [] })
      case '/internal/master':
        return Response.json({})
      case '/internal/master/versions':
        return Response.json({ versions: [] })
      case '/internal/songs/updated-at':
      case '/internal/users/test-user/updated-at':
        return Response.json({ updated_at: null })
      case '/internal/users/test-user/record':
        return Response.json({ standard: [{ id: 123 }] })
      case '/internal/users/test-user/locked-songs':
        return Response.json(
          lockedSongsStatus === 200
            ? { items: [{ id: 'locked-song', is_ultima: false }] }
            : { code: 'player_not_linked', message: 'プレイヤーが連携されていません。' },
          { status: lockedSongsStatus }
        )
      default:
        throw new Error(`Unexpected request: ${path}`)
    }
  })

test('プレイヤー未登録では依存APIを呼ばず登録案内用の状態を返す', async () => {
  // Given
  const calls = installGoalsFetch(false, 404)
  const { fetchGoalsListData } = await loadGoalsListResource()

  // When
  const data = await fetchGoalsListData(() => assert.fail('認証エラーではない'))

  // Then
  assert.equal(data.noPlayerData, true)
  assert.deepEqual(data.records, [])
  assert.deepEqual(data.lockedSongs, [])
  assert.equal(
    calls.some((call) => /\/(record|locked-songs)$/.test(String(call.input))),
    false
  )
})

test('プレイヤー登録済みではレコードと未解禁曲設定を取得する', async () => {
  // Given
  installGoalsFetch(true)
  const { fetchGoalsListData } = await loadGoalsListResource()

  // When
  const data = await fetchGoalsListData(() => assert.fail('認証エラーではない'))

  // Then
  assert.equal(data.noPlayerData, false)
  assert.deepEqual(data.records, [{ id: 123 }])
  assert.deepEqual(data.lockedSongs, [{ id: 'locked-song', is_ultima: false }])
})

test('プレイヤー登録済みの未解禁曲取得エラーは未登録として扱わない', async () => {
  // Given
  installGoalsFetch(true, 500)
  const { fetchGoalsListData } = await loadGoalsListResource()

  // When / Then
  await assert.rejects(
    fetchGoalsListData(() => assert.fail('認証エラーではない')),
    {
      status: 500,
    }
  )
})
