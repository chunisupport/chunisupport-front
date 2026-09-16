import { checkForFrontendUpdate } from '../utils/frontendVersion'

/**
 * APIを取得し、失敗時だけ公開中フロントエンドの更新有無を確認する。
 *
 * @param input - リクエスト先。
 * @param init - fetchオプション。
 * @returns APIレスポンス。
 * @throws fetchが通信エラーになった場合。
 */
export const fetchApi = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(input, init)
    if (!response.ok) await checkForFrontendUpdate()
    return response
  } catch (error) {
    await checkForFrontendUpdate()
    throw error
  }
}
