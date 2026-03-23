import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getUserProfilePageTabValue,
  getUserProfileSearchParamsForTab,
  shouldFetchRecordProfile,
} from './userProfileViewState.ts'

test('view=record のときはレコードタブを開き、レコード用プロフィールを取得する', () => {
  assert.equal(getUserProfilePageTabValue('record'), 'records')
  assert.equal(shouldFetchRecordProfile('record'), true)
})

test('view が未指定または不正値のときはレーティングタブを維持する', () => {
  assert.equal(getUserProfilePageTabValue(undefined), 'rating')
  assert.equal(getUserProfilePageTabValue('invalid'), 'rating')
  assert.equal(shouldFetchRecordProfile(undefined), false)
  assert.equal(shouldFetchRecordProfile('invalid'), false)
})

test('レコードタブ遷移時のみ view=record をクエリに反映する', () => {
  assert.deepEqual(getUserProfileSearchParamsForTab('records'), { view: 'record' })
  assert.deepEqual(getUserProfileSearchParamsForTab('rating'), { view: undefined })
})
