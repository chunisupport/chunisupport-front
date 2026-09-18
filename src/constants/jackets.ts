import { getRequiredEnv } from '../lib/env'

/** CHUNITHM ジャケット画像のベース URL */
export const CHUNITHM_JACKET_BASE_URL = getRequiredEnv('PUBLIC_CHUNITHM_JACKET_BASE_URL')

/** 失敗したジャケット画像のHTTPキャッシュを回避するクエリ名 */
export const JACKET_CACHE_BYPASS_QUERY_PARAM = 'retry'
