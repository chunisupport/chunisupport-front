import { queryOptions } from '@tanstack/solid-query'
import { appQueryClient } from '../lib/queryClient'

/** セッション世代ごとに本人確認を共有するキー。 */
export const authSessionQueryKeys = {
  resolution: (revision: number) => ['auth-session', revision] as const,
}

/** 確認中の要求だけを共有し、認証エラー・オフライン時にも自動再試行しない。 */
export const authSessionQueryOptions = (revision: number, resolve: () => Promise<number>) =>
  queryOptions({
    queryKey: authSessionQueryKeys.resolution(revision),
    queryFn: resolve,
    gcTime: 0,
    retry: false,
    networkMode: 'always',
  })

/** @returns 指定世代で進行中の本人確認。完了済みの応答は再利用しない。 */
export const pendingAuthResolution = (revision: number) => {
  const query = appQueryClient.getQueryCache().find<number>({
    queryKey: authSessionQueryKeys.resolution(revision),
    exact: true,
  })
  return query?.state.fetchStatus === 'fetching' ? query.promise : undefined
}
