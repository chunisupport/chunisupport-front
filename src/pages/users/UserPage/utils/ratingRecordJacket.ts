import { CHUNITHM_JACKET_BASE_URL } from '../../../../constants/jackets'

/**
 * レーティングカード背景用のジャケット画像URLを組み立てる。
 *
 * @param imageId - APIから返されたジャケット画像ID。
 * @returns 背景表示に利用するジャケット画像URL。画像IDが空の場合はnull。
 */
export const buildRatingRecordJacketUrl = (imageId: string): string | null => {
  const normalizedImageId = imageId.trim()
  if (!normalizedImageId) return null

  return `${CHUNITHM_JACKET_BASE_URL}/${normalizedImageId}.webp`
}
