import assert from 'node:assert/strict'
import test from 'node:test'
import { checkForFrontendUpdate, notifyWhenNewFrontendIsAvailable } from './frontendVersion.ts'

test('公開中のビルドIDが実行中と異なる場合は一度だけ更新を通知する', async () => {
  // Given: 新しいビルドが公開され、まだ通知していない。
  const session = new Map<string, string>()
  let notifyCount = 0
  const dependencies = {
    currentBuildId: 'current-build',
    fetchVersion: async () => ({ buildId: 'new-build' }),
    getSessionValue: (key: string) => session.get(key) ?? null,
    setSessionValue: (key: string, value: string) => session.set(key, value),
    notifyUpdate: () => {
      notifyCount += 1
    },
  }

  // When: 1回目のAPI失敗を通知する。
  await notifyWhenNewFrontendIsAvailable(dependencies)

  // Then: 初回のAPI失敗で更新を通知する。
  assert.equal(notifyCount, 1)

  // When: 同じセッションで2回目のAPI失敗を通知する。
  await notifyWhenNewFrontendIsAvailable(dependencies)

  // Then: 同じ公開ビルドは再度通知しない。
  assert.equal(notifyCount, 1)
})

test('同一セッションでも未通知の公開ビルドは再度通知する', async () => {
  // Given: ビルドBの公開を同一セッションですでに通知している。
  const session = new Map<string, string>()
  let publishedBuildId = 'build-b'
  let notifyCount = 0
  const createDependencies = (currentBuildId: string) => ({
    currentBuildId,
    fetchVersion: async () => ({ buildId: publishedBuildId }),
    getSessionValue: (key: string) => session.get(key) ?? null,
    setSessionValue: (key: string, value: string) => session.set(key, value),
    notifyUpdate: () => {
      notifyCount += 1
    },
  })
  await notifyWhenNewFrontendIsAvailable(createDependencies('build-a'))

  // When: ビルドBへ更新した後にビルドCが公開され、ビルドBから更新確認する。
  publishedBuildId = 'build-c'
  await notifyWhenNewFrontendIsAvailable(createDependencies('build-b'))

  // Then: 通知済みのビルドBではなく、未通知のビルドCを再度通知する。
  assert.equal(notifyCount, 2)
})

test('公開中のビルドIDが実行中と同じ場合は通知しない', async () => {
  // Given: 実行中と同じビルドが公開されている。
  let notifyCount = 0

  // When: API失敗を通知する。
  await notifyWhenNewFrontendIsAvailable({
    currentBuildId: 'same-build',
    fetchVersion: async () => ({ buildId: 'same-build' }),
    getSessionValue: () => null,
    setSessionValue: () => undefined,
    notifyUpdate: () => {
      notifyCount += 1
    },
  })

  // Then: 通知しない。
  assert.equal(notifyCount, 0)
})

test('windowがない環境ではバージョン確認を何もせず解決すること', async () => {
  // Given: windowが存在しないNode環境。
  const originalWindow = globalThis.window
  Object.assign(globalThis, { window: undefined })

  try {
    // When: フロントエンド更新を確認する。
    const result = await checkForFrontendUpdate()

    // Then: 何もせず解決する。
    assert.equal(result, undefined)
  } finally {
    Object.assign(globalThis, { window: originalWindow })
  }
})

test('公開中バージョンのbuildIdが文字列なら通知済みとして記録し、再読み込みはしないこと', async () => {
  // Given: 公開中のversion.jsonが文字列のbuildIdを返す。
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  const session = new Map<string, string>()
  let reloadCount = 0
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ buildId: 'new-build' }), { status: 200 })
  Object.assign(globalThis, {
    __FRONTEND_BUILD_ID__: 'current-build',
    window: {
      location: {
        reload: () => {
          reloadCount += 1
        },
      },
      sessionStorage: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => session.set(key, value),
      },
    },
  })

  try {
    // When: フロントエンド更新を確認する。
    await checkForFrontendUpdate()

    // Then: 公開ビルドを通知済みとして記録し、入力を消さないよう自動では再読み込みしない。
    assert.deepEqual([...session.values()], ['new-build'])
    assert.equal(reloadCount, 0)
  } finally {
    globalThis.fetch = originalFetch
    Object.assign(globalThis, { window: originalWindow })
  }
})

test('バージョン情報を取得できない場合は既存エラー処理へフォールバックする', async () => {
  // Given: バージョン情報の取得も失敗する。
  let notifyCount = 0

  // When & Then: エラーを外へ伝播せず、通知もしない。
  await assert.doesNotReject(
    notifyWhenNewFrontendIsAvailable({
      currentBuildId: 'current-build',
      fetchVersion: async () => {
        throw new Error('network error')
      },
      getSessionValue: () => null,
      setSessionValue: () => undefined,
      notifyUpdate: () => {
        notifyCount += 1
      },
    })
  )
  assert.equal(notifyCount, 0)
})
