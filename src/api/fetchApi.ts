import { checkForFrontendUpdate } from '../utils/frontendVersion'

/**
 * APIを取得し、取得系リクエストの失敗時だけ公開中フロントエンドの更新有無を確認する。
 * 更新確認はバックグラウンドで開始し、元のレスポンスや通信エラーを遅延させない。
 * 呼び出し元が中止したリクエストは通信障害として扱わない。
 * 更新系リクエストでは確認しない。更新があると再読み込みされ、入力中のフォームとエラー表示が消えるため。
 *
 * @param input - リクエスト先。
 * @param init - fetchオプション。
 * @returns APIレスポンス。
 * @throws fetchが通信エラーになった場合。
 */
export const fetchApi = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : undefined
  const method = init?.method ?? request?.method ?? 'GET'
  const signal = init?.signal === undefined ? request?.signal : init.signal
  const shouldCheckUpdate = () => method.toUpperCase() === 'GET' && !signal?.aborted
  try {
    const response = await fetch(input, init)
    if (!response.ok && shouldCheckUpdate()) void checkForFrontendUpdate()
    return response
  } catch (error) {
    if (shouldCheckUpdate()) void checkForFrontendUpdate()
    throw error
  }
}
