import { getRequiredEnv } from '../lib/env'

/** CHUNITHM ジャケット画像のベース URL。 */
export const CHUNITHM_JACKET_BASE_URL = getRequiredEnv('PUBLIC_CHUNITHM_JACKET_BASE_URL')

/** CHUNITHM ジャケット画像のブラウザキャッシュを更新するバージョン。 */
export const CHUNITHM_JACKET_CACHE_VERSION = '20260802'
