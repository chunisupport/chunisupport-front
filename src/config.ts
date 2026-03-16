const backendUrl = import.meta.env.PUBLIC_BACKEND_URL
if (!backendUrl) {
  throw new Error(
    '環境変数 PUBLIC_BACKEND_URL が設定されていません。.envファイルを確認してください。'
  )
}
export const API_BASE_URL = backendUrl
export const CHUNITHM_JACKET_BASE_URL = 'https://reiwa.f5.si/jackets/chunithm'
