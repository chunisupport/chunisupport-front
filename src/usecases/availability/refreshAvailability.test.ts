import assert from 'node:assert/strict'
import test from 'node:test'
import { applySystemStatus, availability, resetAvailability } from '../../stores/availability.ts'
import { loadTestModule } from '../../test/setupTestEnvironment.ts'
import type { SystemStatusDTO } from '../../types/api.ts'

const { createAvailabilityRefresher } = await loadTestModule(
  () => import('./refreshAvailability.ts')
)

test('同時の状態確認は1つのin-flight Promiseへ集約される', async () => {
  // Given: 応答を手動で完了できる状態取得関数
  resetAvailability()
  let fetchCount = 0
  let resolveStatus: ((status: SystemStatusDTO) => void) | undefined
  const statusPromise = new Promise<SystemStatusDTO>((resolve) => {
    resolveStatus = resolve
  })
  const refresher = createAvailabilityRefresher({
    fetchStatus: () => {
      fetchCount += 1
      return statusPromise
    },
    now: () => 100,
  })

  // When: 完了前に2回状態確認を要求する
  const first = refresher.refresh()
  const second = refresher.refresh()
  resolveStatus?.({
    status: 'operational',
    comment: '',
    updated_at: '2026-07-26T12:34:56+09:00',
  })
  const [firstResult, secondResult] = await Promise.all([first, second])

  // Then: API呼び出しとPromiseは共有され、通常稼働状態を反映する
  assert.equal(first, second)
  assert.equal(fetchCount, 1)
  assert.equal(secondResult, firstResult)
  const expectedState = {
    kind: 'operational',
    updatedAt: '2026-07-26T12:34:56+09:00',
    checkedAt: 100,
  }
  assert.deepEqual(firstResult, { type: 'success', state: expectedState })
  assert.deepEqual(availability.state, expectedState)
})

test('既知のメンテナンス中に再確認が失敗してもコメントを保持する', async () => {
  // Given: コメント取得済みのメンテナンス状態と失敗する取得関数
  applySystemStatus(
    {
      status: 'maintenance',
      comment: 'データ更新中です',
      updated_at: '2026-07-26T12:34:56+09:00',
    },
    100,
    60
  )
  const refresher = createAvailabilityRefresher({
    fetchStatus: async () => {
      throw new Error('network error')
    },
    now: () => 200,
  })

  // When: 状態を再確認する
  const result = await refresher.refresh()

  // Then: 失敗結果を返し、最後に取得したメンテナンス表示を維持する
  assert.equal(result.type, 'failure')
  assert.equal(availability.state.kind, 'maintenance')
  if (availability.state.kind === 'maintenance') {
    assert.equal(availability.state.comment, 'データ更新中です')
    assert.equal(availability.state.checkedAt, 100)
  }
})

test('状態確認を中止した場合はStoreを接続不能へ変更しない', async () => {
  // Given: AbortSignalで終了する状態取得関数
  resetAvailability()
  const refresher = createAvailabilityRefresher({
    fetchStatus: (signal) =>
      new Promise<SystemStatusDTO>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
  })

  // When: 進行中の状態確認を中止する
  const resultPromise = refresher.refresh()
  refresher.abort()
  const result = await resultPromise

  // Then: キャンセル結果となり、確認前の状態を維持する
  assert.equal(result.type, 'aborted')
  assert.deepEqual(availability.state, { kind: 'checking' })
})

test('メンテナンス継続時は前回の再確認間隔を引き継ぐ', async () => {
  // Given: 90秒の再確認間隔を持つメンテナンス状態
  resetAvailability()
  applySystemStatus(
    {
      status: 'maintenance',
      comment: '更新中',
      updated_at: '2026-07-26T12:34:56+09:00',
    },
    100,
    90
  )
  const refresher = createAvailabilityRefresher({
    fetchStatus: async () => ({
      status: 'maintenance',
      comment: '更新中',
      updated_at: '2026-07-26T12:34:56+09:00',
    }),
    now: () => 200,
  })

  // When: オプション指定なしで状態確認する
  const result = await refresher.refresh()

  // Then: 前回の90秒を引き継いだメンテナンス状態になる
  assert.equal(result.type, 'success')
  assert.deepEqual(result.state, {
    kind: 'maintenance',
    comment: '更新中',
    updatedAt: '2026-07-26T12:34:56+09:00',
    retryAfterSeconds: 90,
    checkedAt: 200,
  })
})

test('完了後の状態確認は新しい取得を開始する', async () => {
  // Given: 成功応答を返す取得関数
  resetAvailability()
  let fetchCount = 0
  const refresher = createAvailabilityRefresher({
    fetchStatus: async () => {
      fetchCount += 1
      return {
        status: 'operational',
        comment: '',
        updated_at: '2026-07-26T12:34:56+09:00',
      }
    },
    now: () => 100,
  })

  // When: 状態確認を完了後に再度要求する
  await refresher.refresh()
  const result = await refresher.refresh()

  // Then: 取得は2回実行され通常稼働状態を返す
  assert.equal(fetchCount, 2)
  assert.deepEqual(result, {
    type: 'success',
    state: {
      kind: 'operational',
      updatedAt: '2026-07-26T12:34:56+09:00',
      checkedAt: 100,
    },
  })
})

test('完了後のabortは前回signalを中断しない', async () => {
  // Given: signalを記録する取得関数
  resetAvailability()
  const signals: AbortSignal[] = []
  const refresher = createAvailabilityRefresher({
    fetchStatus: async (signal) => {
      if (signal) {
        signals.push(signal)
      }
      return {
        status: 'operational',
        comment: '',
        updated_at: '2026-07-26T12:34:56+09:00',
      }
    },
    now: () => 100,
  })
  await refresher.refresh()

  // When: 完了後にabortする
  refresher.abort()

  // Then: 前回signalは中断されない
  assert.equal(signals.length, 1)
  assert.equal(signals[0]?.aborted, false)
})

test('中止後に取得関数が成功してもStoreへ結果を反映しない', async () => {
  // Given: AbortSignalを無視して後から成功する状態取得関数
  resetAvailability()
  let resolveStatus: ((status: SystemStatusDTO) => void) | undefined
  const refresher = createAvailabilityRefresher({
    fetchStatus: () =>
      new Promise<SystemStatusDTO>((resolve) => {
        resolveStatus = resolve
      }),
  })

  // When: 状態確認を中止した後にAPI成功相当の値を返す
  const resultPromise = refresher.refresh()
  refresher.abort()
  resolveStatus?.({
    status: 'operational',
    comment: '',
    updated_at: '2026-07-26T12:34:56+09:00',
  })
  const result = await resultPromise

  // Then: キャンセル結果となり、遅延した成功値をStoreへ反映しない
  assert.equal(result.type, 'aborted')
  assert.deepEqual(availability.state, { kind: 'checking' })
})
