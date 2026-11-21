import assert from 'node:assert/strict'
import test from 'node:test'
import { clearAuthenticatedUser, getAuthenticatedUser } from '../stores/authSession'
import { loadTestModule } from '../test/setupTestEnvironment'

test('後の本人確認が先に成功しても旧要求の戻り先へは遷移しない', async (t) => {
  const { redirectAfterAuthentication } = await loadTestModule(() => import('./postAuthRedirect'), {
    authenticate: true,
  })
  let started!: () => void
  const sent = new Promise<void>((done) => {
    started = done
  })
  let finish!: (response: Response) => void
  const delayed = new Promise<Response>((done) => {
    finish = done
  })
  let calls = 0
  t.mock.method(globalThis, 'fetch', () => {
    if (++calls === 1) {
      started()
      return delayed
    }
    return Response.json({ username: 'new', account_type: 'PLAYER' })
  })
  const routes: unknown[] = []
  const first = redirectAfterAuthentication((path) => {
    routes.push(path)
  }, '/old')
  await sent
  await redirectAfterAuthentication((path) => {
    routes.push(path)
  }, '/new')
  finish(Response.json({ username: 'old', account_type: 'PLAYER' }))
  await first
  assert.deepEqual(routes, ['/new'])
  assert.equal(getAuthenticatedUser()?.username, 'new')
})

test('ログイン後の本人確認中にログアウトすれば、遅れた成功応答で保存・遷移しない', async (t) => {
  const { redirectAfterAuthentication } = await loadTestModule(() => import('./postAuthRedirect'), {
    authenticate: true,
  })
  t.mock.method(globalThis, 'fetch', async () => {
    clearAuthenticatedUser()
    return Response.json({ username: 'old', account_type: 'PLAYER' })
  })
  await redirectAfterAuthentication(() => assert.fail('旧セッションで遷移してはいけない'), '/goals')
  assert.equal(getAuthenticatedUser(), null)
})
