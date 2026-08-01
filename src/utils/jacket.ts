import { CHUNITHM_JACKET_BASE_URL, CHUNITHM_JACKET_CACHE_VERSION } from '../constants/jackets'

/**
 * CHUNITHMのジャケット画像URLを組み立てる。
 *
 * @param imageId - APIから返されたジャケット画像ID。
 * @returns キャッシュバージョン付きジャケット画像URL。画像IDが空の場合はnull。
 */
export const buildChunithmJacketUrl = (imageId: string | null): string | null => {
  const normalizedImageId = imageId?.trim()
  if (!normalizedImageId) return null

  return `${CHUNITHM_JACKET_BASE_URL}/${normalizedImageId}.webp?v=${CHUNITHM_JACKET_CACHE_VERSION}`
}
