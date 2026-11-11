import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

/**
 * モジュール内定数をテストごとに再評価してプロフィールコメント API 関数群を読み込む。
 * @returns プロフィールコメント API モジュール。
 */
const loadUserCommentApi = () =>
  loadTestModule((cacheKey) => import(`./userComment.ts?cache=${cacheKey}`), {
    authenticate: true,
  })

test('コメント取得APIはusernameをエンコードしてGETし、コメントを返す', async () => {
  // Given: コメントが保存済みのレスポンスと、中断用のシグナル。
  const controller = new AbortController()
  const calls = installFetchRecorder(() => Response.json({ comment: 'よろしく' }))

  // When: エンコードが必要なユーザー名でコメントを取得する。
  const { fetchUserComment } = await loadUserCommentApi()
  const comment = await fetchUserComment('user/name', controller.signal)

  // Then: 仕様どおりのURLへシグナル付きでGETし、コメント文字列を取り出す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/users/user%2Fname/comment')
  assert.equal(calls[0]?.init?.method, 'GET')
  assert.equal(calls[0]?.init?.signal, controller.signal)
  assert.equal(comment, 'よろしく')
})

test('コメント取得APIは未設定をnullで返す', async () => {
  // Given: コメント未設定のレスポンス。
  installFetchRecorder(() => Response.json({ comment: null }))

  // When: コメントを取得する。
  const { fetchUserComment } = await loadUserCommentApi()
  const comment = await fetchUserComment('targetuser')

  // Then: 未設定は null になる。
  assert.equal(comment, null)
})

test('コメント更新APIは認証付きPUTでcommentを送り、保存結果を返す', async () => {
  // Given: API が空白を取り除いて保存した結果のレスポンス。
  const calls = installFetchRecorder(() => Response.json({ comment: 'よろしく' }))

  // When: 前後に空白のあるコメントを保存する。
  const { updateMyComment } = await loadUserCommentApi()
  const comment = await updateMyComment(' よろしく ')

  // Then: 入力をそのまま送り、API が保存した値を返す。
  assert.equal(String(calls[0]?.input), 'http://localhost:3000/internal/me/comment')
  assert.equal(calls[0]?.init?.method, 'PUT')
  assert.equal(calls[0]?.init?.body, JSON.stringify({ comment: ' よろしく ' }))
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer test-token')
  assert.equal(comment, 'よろしく')
})

test('コメント更新APIは空文字で未設定に戻した結果をnullで返す', async () => {
  // Given: 未設定に戻したことを表すレスポンス。
  const calls = installFetchRecorder(() => Response.json({ comment: null }))

  // When: 空文字でコメントを更新する。
  const { updateMyComment } = await loadUserCommentApi()
  const comment = await updateMyComment('')

  // Then: 空文字を送り、null を返す。
  assert.equal(calls[0]?.init?.body, JSON.stringify({ comment: '' }))
  assert.equal(comment, null)
})
