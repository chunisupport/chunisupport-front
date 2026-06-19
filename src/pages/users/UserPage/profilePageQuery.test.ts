import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildUserOverPowerPagePath,
  buildUserProfilePagePath,
  DEFAULT_PROFILE_PAGE_QUERY,
  isRecordPageQuery,
  resolveOverPowerSubPage,
  resolveProfilePageQuery,
} from './profilePageQuery.ts'

test('page パラメータ未指定時は rating_best を返す', () => {
  assert.equal(resolveProfilePageQuery(undefined), DEFAULT_PROFILE_PAGE_QUERY)
})

test('page パスパラメータが不正値のときは rating_best を返す', () => {
  assert.equal(resolveProfilePageQuery('invalid'), DEFAULT_PROFILE_PAGE_QUERY)
})

test('page パスパラメータが許可値ならそのまま返す', () => {
  assert.equal(resolveProfilePageQuery('rating_new'), 'rating_new')
  assert.equal(resolveProfilePageQuery('record_normal'), 'record_normal')
  assert.equal(resolveProfilePageQuery('record_we'), 'record_we')
  assert.equal(resolveProfilePageQuery('overpower'), 'overpower')
})

test('page パスパラメータが無効でもクエリパラメータが有効ならクエリを採用する', () => {
  assert.equal(resolveProfilePageQuery(undefined, 'record_we'), 'record_we')
})

test('record 系ページかどうかを判定できる', () => {
  assert.equal(isRecordPageQuery('record_normal'), true)
  assert.equal(isRecordPageQuery('record_we'), true)
  assert.equal(isRecordPageQuery('rating_best'), false)
  assert.equal(isRecordPageQuery('overpower'), false)
  assert.equal(isRecordPageQuery(undefined), false)
})

test('デフォルトタブはユーザールート直下に正規化する', () => {
  assert.equal(buildUserProfilePagePath('alice', 'rating_best'), '/users/alice')
})

test('デフォルト以外のタブはパスセグメントとして表現する', () => {
  assert.equal(buildUserProfilePagePath('alice', 'rating_new'), '/users/alice/rating_new')
  assert.equal(buildUserProfilePagePath('alice', 'record_normal'), '/users/alice/record_normal')
})

test('OVER POWERサブページを解決できる', () => {
  assert.equal(resolveOverPowerSubPage('genre'), 'genre')
  assert.equal(resolveOverPowerSubPage('diff'), 'diff')
  assert.equal(resolveOverPowerSubPage('level'), 'level')
  assert.equal(resolveOverPowerSubPage('version'), 'version')
  assert.equal(resolveOverPowerSubPage('invalid'), 'genre')
  assert.equal(resolveOverPowerSubPage(undefined), 'genre')
})

test('OVER POWERサブページはパスセグメントとして表現する', () => {
  assert.equal(buildUserOverPowerPagePath('alice', 'genre'), '/users/alice/overpower/genre')
  assert.equal(buildUserOverPowerPagePath('alice', 'diff'), '/users/alice/overpower/diff')
})
