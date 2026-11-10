import { CHUNITHM_JACKET_BASE_URL, JACKET_CACHE_BYPASS_QUERY_PARAM } from '../constants/jackets'

/**
 * CHUNITHMのジャケット画像URLを組み立てる。
 *
 * @param imageId - APIから返されたジャケット画像ID。
 * @returns ジャケット画像URL。画像IDが空の場合はnull。
 */
export const buildChunithmJacketUrl = (imageId: string | null): string | null => {
  const normalizedImageId = imageId?.trim()
  if (!normalizedImageId) return null

  return `${CHUNITHM_JACKET_BASE_URL}/${normalizedImageId}.webp`
}

/**
 * 失敗したジャケット画像のHTTPキャッシュを回避するURLを組み立てる。
 *
 * @param sourceUrl - 再取得するジャケット画像URL。
 * @param retryKey - 訪問ごとに異なる再取得キー。
 * @returns 既存のクエリとハッシュを保った再取得用URL。
 */
export const buildChunithmJacketRetryUrl = (sourceUrl: string, retryKey: string): string => {
  const retryUrl = new URL(sourceUrl)
  retryUrl.searchParams.set(JACKET_CACHE_BYPASS_QUERY_PARAM, retryKey)
  return retryUrl.toString()
}
