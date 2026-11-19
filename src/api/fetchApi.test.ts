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

for (const fromRequest of [false, true]) {
  test(`中止されたGETはフロントエンド更新を確認しない (${fromRequest ? 'Request' : 'init'}のsignal)`, async (t) => {
    // Given: 呼び出し元のsignalが中止されるまで通信が続く。
    const controller = new AbortController()
    const { signal } = controller
    const fetchMock = t.mock.method(
      globalThis,
      'fetch',
      () =>
        new Promise<Response>((_resolve, reject) => {
          if (signal.aborted) reject(signal.reason)
          else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        })
    )
    const originalWindow = globalThis.window
    const originalBuildId = Reflect.get(globalThis, '__FRONTEND_BUILD_ID__')
    Object.assign(globalThis, { window: {}, __FRONTEND_BUILD_ID__: 'old-build' })
    t.after(() => {
      Object.assign(globalThis, { window: originalWindow, __FRONTEND_BUILD_ID__: originalBuildId })
    })

    // When: Requestまたはinitからsignalを渡し、通信開始後に中止する。
    const input = fromRequest ? new Request('http://localhost/songs', { signal }) : '/songs'
    const request = fetchApi(input, fromRequest ? undefined : { signal })
    assert.equal(fetchMock.mock.callCount(), 1)
    controller.abort()
    await assert.rejects(request, { name: 'AbortError' })
    await new Promise((resolve) => setImmediate(resolve))

    // Then: 元のエラーだけを返し、version.jsonは取得しない。
    assert.equal(fetchMock.mock.callCount(), 1)
  })
}

for (const { name, respond } of [
  { name: '入力エラー', respond: () => new Response(null, { status: 400 }) },
  {
    name: '通信エラー',
    respond: () => {
      throw new Error('api network error')
    },
  },
]) {
  test(`更新系リクエストの${name}ではバージョン確認をしない`, async () => {
    // Given: 新しいビルドが公開済みで、バージョン確認が走れば再読み込みされる状態。
    const originalFetch = globalThis.fetch
    const originalWindow = globalThis.window
    const requestedUrls: string[] = []
    let reloadCount = 0
    globalThis.fetch = async (input) => {
      requestedUrls.push(String(input))
      if (String(input) === '/version.json') {
        return Response.json({ buildId: 'new-build' })
      }
      return respond()
    }
    Object.assign(globalThis, {
      __FRONTEND_BUILD_ID__: 'current-build',
      window: {
        location: {
          reload: () => {
            reloadCount += 1
          },
        },
        sessionStorage: {
          getItem: () => null,
          setItem: () => undefined,
        },
      },
    })

    try {
      // When: initとRequestのそれぞれでPOSTを指定してAPIを呼び出す。
      await fetchApi('/internal/goals', { method: 'POST' }).catch(() => undefined)
      await fetchApi(new Request('http://localhost/internal/goals', { method: 'POST' })).catch(
        () => undefined
      )
      await new Promise((resolve) => setImmediate(resolve))

      // Then: version.jsonを取得せず、再読み込みもしない。
      assert.equal(requestedUrls.length, 2)
      assert.ok(requestedUrls.every((url) => !url.includes('/version.json')))
      assert.equal(reloadCount, 0)
    } finally {
      globalThis.fetch = originalFetch
      Object.assign(globalThis, { window: originalWindow })
    }
  })
}
