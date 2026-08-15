import assert from 'node:assert/strict'
import test from 'node:test'
import { applySystemStatus, availability, resetAvailability } from '../../stores/availability.ts'
import type { SystemStatusDTO } from '../../types/api.ts'
import { createAvailabilityRefresher } from './refreshAvailability.ts'

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
  assert.equal(firstResult.type, 'success')
  assert.equal(secondResult, firstResult)
  assert.equal(availability.state.kind, 'operational')
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
