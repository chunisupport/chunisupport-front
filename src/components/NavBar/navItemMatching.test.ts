import assert from 'node:assert/strict'
import test from 'node:test'

import { isHomePath } from './navItemMatching.ts'

test('ホームタブは /users/:username 直下でアクティブ判定される', () => {
  assert.equal(isHomePath('/users/alice'), true)
})

test('ホームタブはプロフィール配下のタブパスでもアクティブ判定される', () => {
  assert.equal(isHomePath('/users/alice/rating_best'), true)
  assert.equal(isHomePath('/users/alice/rating_new'), true)
  assert.equal(isHomePath('/users/alice/record_normal'), true)
  assert.equal(isHomePath('/users/alice/record_we'), true)
  assert.equal(isHomePath('/users/alice/overpower'), true)
  assert.equal(isHomePath('/users/alice/overpower/genre'), true)
  assert.equal(isHomePath('/users/alice/overpower/diff'), true)
  assert.equal(isHomePath('/users/alice/overpower/level'), true)
  assert.equal(isHomePath('/users/alice/overpower/version'), true)
})

test('ホームタブは統計や無関係なパスではアクティブ判定されない', () => {
  assert.equal(isHomePath('/users/alice/stats'), false)
  assert.equal(isHomePath('/users/alice/unknown'), false)
  assert.equal(isHomePath('/users/alice/rating_best/genre'), false)
  assert.equal(isHomePath('/songs'), false)
})
