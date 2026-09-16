import assert from 'node:assert/strict'
import test from 'node:test'
import { reloadWhenNewFrontendIsAvailable } from './frontendVersion.ts'

test('公開中のビルドIDが実行中と異なる場合は一度だけ再読み込みする', async () => {
  // Given: 新しいビルドが公開され、まだ自動再読み込みしていない。
  const session = new Map<string, string>()
  let reloadCount = 0
  const dependencies = {
    currentBuildId: 'current-build',
    fetchVersion: async () => ({ buildId: 'new-build' }),
    getSessionValue: (key: string) => session.get(key) ?? null,
    setSessionValue: (key: string, value: string) => session.set(key, value),
    reload: () => {
      reloadCount += 1
    },
  }

  // When: API失敗を続けて通知する。
  await reloadWhenNewFrontendIsAvailable(dependencies)
  await reloadWhenNewFrontendIsAvailable(dependencies)

  // Then: 同一セッションでは最初の一度だけ再読み込みする。
  assert.equal(reloadCount, 1)
})

test('公開中のビルドIDが実行中と同じ場合は再読み込みしない', async () => {
  // Given: 実行中と同じビルドが公開されている。
  let reloadCount = 0

  // When: API失敗を通知する。
  await reloadWhenNewFrontendIsAvailable({
    currentBuildId: 'same-build',
    fetchVersion: async () => ({ buildId: 'same-build' }),
    getSessionValue: () => null,
    setSessionValue: () => undefined,
    reload: () => {
      reloadCount += 1
    },
  })

  // Then: 再読み込みしない。
  assert.equal(reloadCount, 0)
})

test('バージョン情報を取得できない場合は既存エラー処理へフォールバックする', async () => {
  // Given: バージョン情報の取得も失敗する。
  let reloadCount = 0

  // When & Then: エラーを外へ伝播せず、再読み込みもしない。
  await assert.doesNotReject(
    reloadWhenNewFrontendIsAvailable({
      currentBuildId: 'current-build',
      fetchVersion: async () => {
        throw new Error('network error')
      },
      getSessionValue: () => null,
      setSessionValue: () => undefined,
      reload: () => {
        reloadCount += 1
      },
    })
  )
  assert.equal(reloadCount, 0)
})
