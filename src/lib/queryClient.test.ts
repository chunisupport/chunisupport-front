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

test('createAppQueryClient: mutationを自動再試行しない', () => {
  // Given & When: アプリケーション用QueryClientを生成する。
  const queryClient = createAppQueryClient()

  // Then: mutationのretryは無効。
  assert.equal(queryClient.getDefaultOptions().mutations?.retry, false)
  queryClient.clear()
})
