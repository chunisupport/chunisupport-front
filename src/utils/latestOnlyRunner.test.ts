import assert from 'node:assert/strict'
import test from 'node:test'
import { createLatestOnlyRunner } from './latestOnlyRunner'

/**
 * 外部から解決できる Promise を作る。
 *
 * @returns Promise と解決関数。
 */
const createDeferred = () => {
  let resolve: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

/**
 * 保留中のマイクロタスクを消化する。
 *
 * @returns 消化後に解決される Promise。
 */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

test('実行中に届いた複数の値は最新の1件だけを次に実行すること', async () => {
  // Given
  const executed: string[] = []
  const deferreds: ReturnType<typeof createDeferred>[] = []
  const enqueue = createLatestOnlyRunner(async (value: string) => {
    executed.push(value)
    const deferred = createDeferred()
    deferreds.push(deferred)
    await deferred.promise
  })

  // When
  enqueue('a')
  enqueue('ab')
  enqueue('abc')
  deferreds[0]?.resolve()
  await flush()
  deferreds[1]?.resolve()
  await flush()

  // Then
  assert.deepEqual(executed, ['a', 'abc'])
})

test('処理が失敗しても後続の値を実行すること', async () => {
  // Given
  const executed: string[] = []
  const enqueue = createLatestOnlyRunner(async (value: string) => {
    executed.push(value)
    if (value === 'fail') throw new Error('failed')
  })

  // When
  enqueue('fail')
  await flush()
  enqueue('next')
  await flush()

  // Then
  assert.deepEqual(executed, ['fail', 'next'])
})
