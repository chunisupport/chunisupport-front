import { getRequiredEnv } from './lib/env'

/** バックエンド API のベース URL。 */
export const API_BASE_URL = getRequiredEnv('PUBLIC_BACKEND_URL')
/** フロントエンドサイトのベース URL。 */
export const FRONTEND_BASE_URL = getRequiredEnv('PUBLIC_FRONTEND_URL')
/** ドキュメントサイトのベース URL。 */
export const DOCUMENTATION_BASE_URL = getRequiredEnv('PUBLIC_DOCUMENTATION_URL')
/** ブックマークレット配布サイトのベース URL。 */
export const BOOKMARKLET_BASE_URL = getRequiredEnv('PUBLIC_BOOKMARKLET_URL')
/** Cloudflare Turnstile のサイトキー。 */
export const CF_TURNSTILE_SITE_KEY = getRequiredEnv('PUBLIC_CF_TURNSTILE_SITE_KEY')
/** CHUNITHM ジャケット画像のベース URL。 */
export const CHUNITHM_JACKET_BASE_URL = 'https://reiwa.f5.si/jackets/chunithm'
