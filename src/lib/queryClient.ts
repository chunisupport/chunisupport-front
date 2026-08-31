import { QueryClient } from '@tanstack/solid-query'

type HttpErrorLike = {
  status?: unknown
}

/**
 * queryエラーを再試行するか判定する。
 *
 * @param failureCount - 既に実行した再試行回数。
 * @param error - query functionが送出したエラー。
 * @returns 一時エラーの初回失敗時だけtrue。
 */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const status =
    typeof error === 'object' && error !== null ? (error as HttpErrorLike).status : undefined

  if (typeof status === 'number' && ((status >= 400 && status < 500) || status === 503)) {
    return false
  }

  return failureCount < 1
}

/**
 * アプリケーション用のQueryClientを生成する。
 *
 * @returns 共通のretry方針を設定したQueryClient。
 */
export const createAppQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })

/** アプリケーション全体で共有するQueryClient。 */
export const appQueryClient = createAppQueryClient()
