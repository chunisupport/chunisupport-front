import assert from 'node:assert/strict'
import test from 'node:test'
import { checkForFrontendUpdate } from '../utils/frontendVersion.ts'
import { fetchApi } from './fetchApi.ts'

test('APIの非成功レスポンスはバージョン確認の完了を待たずに返す', async () => {
  // Given: APIは失敗し、後続のバージョン確認は完了していない。
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  let resolveVersion: ((response: Response) => void) | undefined
  const versionResponse = new Promise<Response>((resolve) => {
    resolveVersion = resolve
  })
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount += 1
    if (fetchCount === 1) return new Response(null, { status: 503 })
    return versionResponse
  }
  Object.assign(globalThis, {
    __FRONTEND_BUILD_ID__: 'current-build',
    window: {
      location: { reload: () => undefined },
      sessionStorage: {
        getItem: () => null,
        setItem: () => undefined,
      },
    },
  })

  try {
    // When: APIを取得する。
    let requestSettled = false
    const request = fetchApi('/internal/status').finally(() => {
      requestSettled = true
    })
    await new Promise((resolve) => setImmediate(resolve))

    // Then: バージョン確認中でも元のレスポンスをすぐに返す。
    assert.equal(requestSettled, true)
    const result = await request
    assert.equal(result.status, 503)
    assert.equal(fetchCount, 2)
  } finally {
    resolveVersion?.(new Response(JSON.stringify({ buildId: 'current-build' }), { status: 200 }))
    await checkForFrontendUpdate()
    globalThis.fetch = originalFetch
    Object.assign(globalThis, { window: originalWindow })
  }
})

test('APIの通信エラーはバージョン確認の完了を待たずに送出する', async () => {
  // Given: APIは通信エラーになり、後続のバージョン確認は完了していない。
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  let resolveVersion: ((response: Response) => void) | undefined
  const versionResponse = new Promise<Response>((resolve) => {
    resolveVersion = resolve
  })
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount += 1
    if (fetchCount === 1) throw new Error('api network error')
    return versionResponse
  }
  Object.assign(globalThis, {
    __FRONTEND_BUILD_ID__: 'current-build',
    window: {
      location: { reload: () => undefined },
      sessionStorage: {
        getItem: () => null,
        setItem: () => undefined,
      },
    },
  })

  try {
    // When: APIを取得する。
    let requestSettled = false
    const request = fetchApi('/internal/status').then(
      () => 'resolved',
      (error: unknown) => error
    )
    void request.finally(() => {
      requestSettled = true
    })
    await new Promise((resolve) => setImmediate(resolve))

    // Then: バージョン確認中でも元の通信エラーをすぐに送出する。
    assert.equal(requestSettled, true)
    const result = await request
    assert.ok(result instanceof Error)
    assert.equal(result.message, 'api network error')
    assert.equal(fetchCount, 2)
  } finally {
    resolveVersion?.(new Response(JSON.stringify({ buildId: 'current-build' }), { status: 200 }))
    await checkForFrontendUpdate()
    globalThis.fetch = originalFetch
    Object.assign(globalThis, { window: originalWindow })
  }
})
