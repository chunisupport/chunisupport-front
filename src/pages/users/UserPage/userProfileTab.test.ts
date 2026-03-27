import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_USER_PROFILE_TAB,
  normalizeUserProfileTab,
  resolvePageTab,
  resolveRatingTab,
  resolveRecordTab,
} from './userProfileTab.ts'

test('tab クエリがない場合は rating_best を採用する', () => {
  assert.equal(normalizeUserProfileTab(undefined), DEFAULT_USER_PROFILE_TAB)
})

test('未知の tab クエリは rating_best にフォールバックする', () => {
  assert.equal(normalizeUserProfileTab('unknown'), DEFAULT_USER_PROFILE_TAB)
})

test('rating_new は レーティング/新曲枠に解決される', () => {
  const tab = normalizeUserProfileTab('rating_new')
  assert.equal(resolvePageTab(tab), 'rating')
  assert.equal(resolveRatingTab(tab), 'new')
})

test("record_we は レコード/WORLD'S END に解決される", () => {
  const tab = normalizeUserProfileTab('record_we')
  assert.equal(resolvePageTab(tab), 'records')
  assert.equal(resolveRecordTab(tab), 'worldsend')
})
