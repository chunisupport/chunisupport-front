import {
  type DefaultError,
  type FetchQueryOptions,
  isCancelledError,
  type QueryKey,
} from '@tanstack/solid-query'
import { appQueryClient } from '../lib/queryClient'

/**
 * 共通QueryClientで取得し、query削除によるキャンセル時だけ最大1回再取得する。
 * 削除後の同時取得はTanStack Queryに共有させ、通常のキャンセルや通信エラーは再試行しない。
 * @param options - 取得対象のキー、取得関数、キャッシュ方針。
 * @returns キャッシュ済み、または削除後に再取得したデータ。
 */
export const fetchQueryWithRestartOnRemoval = async <
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): Promise<TData> => {
  const pending = appQueryClient.fetchQuery(options)
  const cache = appQueryClient.getQueryCache()
  const query = cache.find({ queryKey: options.queryKey, exact: true })

  try {
    return await pending
  } catch (error) {
    if (isCancelledError(error) && query && cache.get(query.queryHash) !== query) {
      // この再取得は同じcatchで捕捉しない。繰り返し削除されても再試行は1回まで。
      return appQueryClient.fetchQuery(options)
    }
    throw error
  }
}
