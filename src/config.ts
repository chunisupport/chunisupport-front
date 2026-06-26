import { getRequiredEnv } from './lib/env'

/** バックエンド API のベース URL。 */
export const API_BASE_URL = getRequiredEnv('PUBLIC_BACKEND_URL')
/** フロントエンドサイトのベース URL。 */
export const FRONTEND_BASE_URL = getRequiredEnv('PUBLIC_FRONTEND_URL')
/** ドキュメントサイトのベース URL。 */
export const DOCUMENTATION_BASE_URL = getRequiredEnv('PUBLIC_DOCUMENTATION_URL')
/** ブックマークレット配布サイトのベース URL。 */
export const BOOKMARKLET_BASE_URL = getRequiredEnv('PUBLIC_BOOKMARKLET_URL')
/** 現在の環境で使用するブックマークレットのエントリーポイント名。 */
export const BOOKMARKLET_ENTRYPOINT = getRequiredEnv('PUBLIC_BOOKMARKLET_ENTRYPOINT')
/** Cloudflare Turnstile のサイトキー。 */
export const CF_TURNSTILE_SITE_KEY = getRequiredEnv('PUBLIC_CF_TURNSTILE_SITE_KEY')
export { CHUNITHM_JACKET_BASE_URL } from './constants/jackets'
