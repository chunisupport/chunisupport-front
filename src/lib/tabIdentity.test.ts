import assert from 'node:assert/strict'
import test from 'node:test'
import { createTabIdentity } from './tabIdentity'

test('別タブの変更は通知前の API 送信も止め、旧画面を一度だけ閉じる', () => {
  let closed = 0
  const tab = createTabIdentity(() => {
    closed++
  })
  tab.observe('a')
  assert.equal(tab.matches('b'), false)
  tab.observe('b')
  assert.equal(tab.matches('a'), false)
  assert.equal(closed, 1)
})

test('初回復元・このタブ自身のログインとログアウトでは画面を閉じない', () => {
  const tab = createTabIdentity(() => assert.fail())
  tab.observe(null)
  for (const uid of ['a', null]) {
    tab.expect(uid)
    assert.equal(tab.matches(uid === null ? 'a' : null), true)
    tab.observe(uid)
    assert.equal(tab.matches(uid), true)
  }
})
