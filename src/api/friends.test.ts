import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価して friends API 関数群を読み込む。
 * @returns friends API モジュール。
 */
const loadFriendsApi = () =>
  loadTestModule((cacheKey) => import(`./friends.ts?cache=${cacheKey}`), { authenticate: true })

test('フレンド一覧APIは認証付きGETでitemsレスポンスを返す', async () => {
  // Given: フレンド一覧APIの呼び出し記録。
  const calls = installFetchRecorder(() => Response.json({ items: [] }))

  // When: フレンド一覧を取得する。
  const { fetchFriends } = await loadFriendsApi()
  await fetchFriends()

  // Then: 仕様どおりのURLとメソッドで認証付き呼び出しをする。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/friends')
  assert.equal(calls[0]?.init?.method, 'GET')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
})

test('フレンド一覧APIはAbortSignalをHTTPリクエストへ引き渡す', async () => {
  // Given: 3種類の一覧取得へ共通で渡すAbortSignal。
  const controller = new AbortController()
  const calls = installFetchRecorder(() => Response.json({ items: [] }))

  // When: 各一覧を同じシグナルで取得する。
  const { fetchFriends, fetchReceivedFriendRequests, fetchSentFriendRequests } =
    await loadFriendsApi()
  await fetchFriends(controller.signal)
  await fetchReceivedFriendRequests(controller.signal)
  await fetchSentFriendRequests(controller.signal)

  // Then: TanStack Queryが中断できるよう、すべてのfetchへ同じシグナルが渡る。
  assert.deepEqual(
    calls.map((call) => call.init?.signal),
    [controller.signal, controller.signal, controller.signal]
  )
})

test('フレンド申請APIはusernameをPOSTする', async () => {
  // Given: API呼び出し内容の記録。
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))

  // When: フレンド申請を作成する。
  const { createFriendRequest } = await loadFriendsApi()
  await createFriendRequest({ username: 'targetuser' })

  // Then: username完全一致申請のAPI仕様どおりに送信する。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/friends/requests')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ username: 'targetuser' }))
})

test('フレンド操作APIはusernameをエンコードして呼び出す', async () => {
  // Given: 操作API呼び出し内容の記録。
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))

  // When: 承認、拒否、申請取り消し、解除APIを呼び出す。
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, deleteFriend } =
    await loadFriendsApi()
  await acceptFriendRequest('requester1')
  await rejectFriendRequest('requester2')
  await cancelFriendRequest('targetuser')
  await deleteFriend('frienduser')

  // Then: usernameパスパラメータを使うAPI仕様どおりに呼び出す。
  assert.deepEqual(
    calls.map((call) => `${call.init?.method} ${String(call.input)}`),
    [
      'POST http://localhost:3000/internal/friends/requests/requester1/accept',
      'POST http://localhost:3000/internal/friends/requests/requester2/reject',
      'DELETE http://localhost:3000/internal/friends/requests/targetuser',
      'DELETE http://localhost:3000/internal/friends/frienduser',
    ]
  )
})

test('不正なusernameはすべての更新APIで送信前に拒否する', async () => {
  // Given: API呼び出し回数の記録。
  const calls = installFetchRecorder(() => new Response(null, { status: 204 }))
  const {
    createFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    deleteFriend,
  } = await loadFriendsApi()

  // When & Then: body と各 username パスの不正値を拒否する。
  await assert.rejects(() => createFriendRequest({ username: 'InvalidUser' }), TypeError)
  await assert.rejects(() => acceptFriendRequest('user name'), TypeError)
  await assert.rejects(() => rejectFriendRequest('user_name'), TypeError)
  await assert.rejects(() => cancelFriendRequest('user-1'), TypeError)
  await assert.rejects(() => deleteFriend('user'), TypeError)
  assert.equal(calls.length, 0)
})
