import assert from 'node:assert/strict'
import test from 'node:test'
import { createAppQueryClient, shouldRetryQuery } from './queryClient.ts'

test('shouldRetryQuery: 4xxとメンテナンス中の503は再試行しない', () => {
  // Given: クライアントエラーとメンテナンスエラー。
  const clientError = Object.assign(new Error('invalid request'), { status: 400 })
  const maintenanceError = Object.assign(new Error('maintenance'), { status: 503 })

  // When: 初回失敗後の再試行可否を判定する。
  const retryClientError = shouldRetryQuery(0, clientError)
  const retryMaintenanceError = shouldRetryQuery(0, maintenanceError)

  // Then: どちらも再試行しない。
  assert.equal(retryClientError, false)
  assert.equal(retryMaintenanceError, false)
})

test('shouldRetryQuery: 一時エラーは最大1回だけ再試行する', () => {
  // Given: statusを持たないネットワークエラー。
  const error = new Error('network error')

  // When & Then: 初回失敗後だけ再試行する。
  assert.equal(shouldRetryQuery(0, error), true)
  assert.equal(shouldRetryQuery(1, error), false)
})

test('shouldRetryQuery: 500番台の一時エラーは初回だけ再試行する', () => {
  // Given: 503以外のサーバーエラー
  const serverError = Object.assign(new Error('server error'), { status: 500 })

  // When: 初回失敗後と2回目失敗後の再試行可否を判定する
  const retryFirst = shouldRetryQuery(0, serverError)
  const retrySecond = shouldRetryQuery(1, serverError)

  // Then: 初回だけ再試行する
  assert.equal(retryFirst, true)
  assert.equal(retrySecond, false)
})

test('shouldRetryQuery: エラーがnullやundefinedでも再試行可否を判定できる', () => {
  // Given: statusを持たないnullとundefinedのエラー
  const nullError = null
  const undefinedError = undefined

  // When: 初回失敗後の再試行可否を判定する
  const retryNull = shouldRetryQuery(0, nullError)
  const retryUndefined = shouldRetryQuery(0, undefinedError)

  // Then: どちらも初回は再試行する
  assert.equal(retryNull, true)
  assert.equal(retryUndefined, true)
})

test('createAppQueryClient: mutationを自動再試行しない', () => {
  // Given & When: アプリケーション用QueryClientを生成する。
  const queryClient = createAppQueryClient()

  // Then: mutationのretryは無効。
  assert.equal(queryClient.getDefaultOptions().mutations?.retry, false)
  queryClient.clear()
})
