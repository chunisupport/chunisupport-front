import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyProfileSwipeTab,
  getSwipedProfileTab,
  PROFILE_SWIPE_THRESHOLD_PX,
  resolveProfileSwipeTab,
} from './profileSwipeTabs.ts'

test('表示中の大分類と小分類からスワイプ対象タブを解決できる', () => {
  assert.equal(resolveProfileSwipeTab('rating', 'best', 'standard'), 'best')
  assert.equal(resolveProfileSwipeTab('rating', 'new', 'standard'), 'new')
  assert.equal(resolveProfileSwipeTab('records', 'best', 'standard'), 'standard')
  assert.equal(resolveProfileSwipeTab('records', 'best', 'worldsend'), 'worldsend')
})

test('スワイプ対象タブから表示すべき大分類と小分類へ変換できる', () => {
  assert.deepEqual(applyProfileSwipeTab('best'), {
    pageTab: 'rating',
    ratingTab: 'best',
    recordTab: 'standard',
  })
  assert.deepEqual(applyProfileSwipeTab('new'), {
    pageTab: 'rating',
    ratingTab: 'new',
    recordTab: 'standard',
  })
  assert.deepEqual(applyProfileSwipeTab('standard'), {
    pageTab: 'records',
    ratingTab: 'new',
    recordTab: 'standard',
  })
  assert.deepEqual(applyProfileSwipeTab('worldsend'), {
    pageTab: 'records',
    ratingTab: 'new',
    recordTab: 'worldsend',
  })
})

test('左スワイプで次タブへ進み、右スワイプで前タブへ戻る', () => {
  assert.equal(getSwipedProfileTab('best', -PROFILE_SWIPE_THRESHOLD_PX), 'new')
  assert.equal(getSwipedProfileTab('new', -PROFILE_SWIPE_THRESHOLD_PX), 'standard')
  assert.equal(getSwipedProfileTab('standard', PROFILE_SWIPE_THRESHOLD_PX), 'new')
})

test('しきい値未満の移動量ではタブが変わらない', () => {
  assert.equal(getSwipedProfileTab('new', PROFILE_SWIPE_THRESHOLD_PX - 1), 'new')
  assert.equal(getSwipedProfileTab('new', -PROFILE_SWIPE_THRESHOLD_PX + 1), 'new')
})

test('先頭・末尾タブでは外側へスワイプしても端で止まる', () => {
  assert.equal(getSwipedProfileTab('best', PROFILE_SWIPE_THRESHOLD_PX + 30), 'best')
  assert.equal(getSwipedProfileTab('worldsend', -PROFILE_SWIPE_THRESHOLD_PX - 30), 'worldsend')
})
