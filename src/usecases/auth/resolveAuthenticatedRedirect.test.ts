import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAuthenticatedRedirect } from './resolveAuthenticatedRedirect'

test('認証済みならプロフィール取得を待たず安全な戻り先を選ぶ', () => {
  assert.equal(resolveAuthenticatedRedirect('alice', '/goals'), '/goals')
})

test('戻り先がない場合と安全でない場合は本人のページを選ぶ', () => {
  for (const path of [undefined, '//example.com', '/login']) {
    assert.equal(resolveAuthenticatedRedirect('alice name', path), '/users/alice%20name')
  }
})
