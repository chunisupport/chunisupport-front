import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { isCancelledError, queryOptions } from '@tanstack/solid-query'
import { appQueryClient } from '../lib/queryClient'
import { fetchQueryWithRestartOnRemoval } from './fetchQueryWithRestartOnRemoval'

beforeEach(() => appQueryClient.clear())
afterEach(() => appQueryClient.clear())

/**
 * テストから任意のタイミングで応答できるPromiseを生成する。
 * @returns 応答待ちPromiseと解決関数。
 */
const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

test('query削除後は同時呼び出しを共有して最新値で解決する', async () => {
  // Given: 無効化前のAPI応答を保留する。
  const original = createDeferred<number>()
  const restarted = createDeferred<void>()
  let count = 0
  const options = queryOptions({
    queryKey: ['restart-test'],
    queryFn: () => {
      if (++count === 1) return original.promise
      restarted.resolve()
      return Promise.resolve(2)
    },
    staleTime: Infinity,
    retry: false,
  })
  const first = fetchQueryWithRestartOnRemoval(options)
  const shared = fetchQueryWithRestartOnRemoval(options)

  // When: 呼び出し元が待機中のqueryを削除する。
  appQueryClient.removeQueries({ queryKey: options.queryKey, exact: true })
  await restarted.promise
  const results = await Promise.all([first, shared])
  original.resolve(1)

  // Then: 自動的に再取得し、古い応答は返さずキャッシュにも採用しない。
  assert.deepEqual(results, [2, 2])
  assert.equal(await fetchQueryWithRestartOnRemoval(options), 2)
  assert.equal(count, 2)
})

test('queryを削除しない意図的なキャンセルは再取得しない', async () => {
  // Given: 応答待ちのquery。
  const response = createDeferred<number>()
  let count = 0
  const options = queryOptions({
    queryKey: ['cancel-test'],
    queryFn: () => {
      count += 1
      return response.promise
    },
    retry: false,
  })
  const pending = fetchQueryWithRestartOnRemoval(options)
  const rejected = assert.rejects(pending, isCancelledError)

  // When: queryは残したままキャンセルする。
  await appQueryClient.cancelQueries({ queryKey: options.queryKey, exact: true })
  await rejected
  response.resolve(1)

  // Then: キャンセルを呼び出し元へ伝え、取得回数は増やさない。
  assert.equal(count, 1)
})

test('再取得中にもう一度削除されても再試行は1回で打ち切る', async () => {
  // Given: 初回と再取得の応答を保留するquery。
  const original = createDeferred<number>()
  const second = createDeferred<number>()
  const restarted = createDeferred<void>()
  let count = 0
  const options = queryOptions({
    queryKey: ['restart-limit-test'],
    queryFn: () => {
      if (++count === 1) return original.promise
      restarted.resolve()
      return second.promise
    },
    retry: false,
  })
  const pending = fetchQueryWithRestartOnRemoval(options)
  const rejected = assert.rejects(pending, isCancelledError)

  // When: 削除による再取得が始まった後、再び削除する。
  appQueryClient.removeQueries({ queryKey: options.queryKey, exact: true })
  await restarted.promise
  appQueryClient.removeQueries({ queryKey: options.queryKey, exact: true })
  await rejected
  original.resolve(1)
  second.resolve(2)

  // Then: 3回目の取得や無限ループは発生しない。
  assert.equal(count, 2)
})

test('通常の取得エラーは再試行せず、そのまま伝える', async () => {
  // Given: 通信に失敗するquery。
  const error = new Error('network error')
  let count = 0
  const options = queryOptions({
    queryKey: ['error-test'],
    queryFn: async () => {
      count += 1
      throw error
    },
    retry: false,
  })

  // When / Then: エラーを返し、ヘルパー独自の再試行を行わない。
  await assert.rejects(fetchQueryWithRestartOnRemoval(options), (caught) => caught === error)
  assert.equal(count, 1)
})

test('削除後の再取得に失敗した場合は古い応答で成功扱いにしない', async () => {
  // Given: 削除後の取得だけ失敗するquery。
  const original = createDeferred<number>()
  let count = 0
  const options = queryOptions({
    queryKey: ['restart-error-test'],
    queryFn: async () => {
      if (++count === 1) return original.promise
      throw new Error('network error')
    },
    retry: false,
  })
  const pending = fetchQueryWithRestartOnRemoval(options)
  const rejected = assert.rejects(pending, /network error/)

  // When: queryを削除して最新値を再取得する。
  appQueryClient.removeQueries({ queryKey: options.queryKey, exact: true })
  await rejected
  original.resolve(1)

  // Then: 古い応答は採用されず、通信エラー以上の再試行もしない。
  assert.equal(appQueryClient.getQueryData(options.queryKey), undefined)
  assert.equal(count, 2)
})
