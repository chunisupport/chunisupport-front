import { checkForFrontendUpdate } from '../utils/frontendVersion'

/**
 * APIを取得し、失敗時だけ公開中フロントエンドの更新有無を確認する。
 * 更新確認はバックグラウンドで開始し、元のレスポンスや通信エラーを遅延させない。
 *
 * @param input - リクエスト先。
 * @param init - fetchオプション。
 * @returns APIレスポンス。
 * @throws fetchが通信エラーになった場合。
 */
export const fetchApi = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(input, init)
    if (!response.ok) void checkForFrontendUpdate()
    return response
  } catch (error) {
    void checkForFrontendUpdate()
    throw error
  }
}
