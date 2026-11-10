import { getEnv, getRequiredEnv } from './lib/env'

/** バックエンド API のベース URL */
export const API_BASE_URL = getRequiredEnv('PUBLIC_BACKEND_URL')
/** フロントエンドサイトのベース URL */
export const FRONTEND_BASE_URL = getRequiredEnv('PUBLIC_FRONTEND_URL')
/** レコード統計JSONの配信元。未設定時はフロントエンドURLから解決する */
export const CHART_STATS_BASE_URL = getEnv().PUBLIC_CHART_STATS_BASE_URL
/** 譜面スコア統計JSONの配信元。未設定時はフロントエンドURLから解決する */
export const CHART_SCORES_BASE_URL = getEnv().PUBLIC_CHART_SCORES_BASE_URL
/** ドキュメントサイトのベース URL */
export const DOCUMENTATION_BASE_URL = getRequiredEnv('PUBLIC_DOCUMENTATION_URL')
/** 外部連携 API のドキュメント URL */
export const API_DOCUMENTATION_URL = `${DOCUMENTATION_BASE_URL.replace(/\/$/, '')}/api/`
/** 楽曲Wikiのベース URL。未設定時はWikiへのリンクを表示しない */
export const WIKI_BASE_URL = getEnv().PUBLIC_WIKI_BASE_URL
/** ブックマークレット配布サイトのベース URL */
export const BOOKMARKLET_BASE_URL = getRequiredEnv('PUBLIC_BOOKMARKLET_URL')
/** 現在の環境で使用するブックマークレットのエントリーポイント名 */
export const BOOKMARKLET_ENTRYPOINT = getRequiredEnv('PUBLIC_BOOKMARKLET_ENTRYPOINT')
/** Cloudflare Turnstile のサイトキー */
export const CF_TURNSTILE_SITE_KEY = getRequiredEnv('PUBLIC_CF_TURNSTILE_SITE_KEY')
