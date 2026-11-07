import { X_TIMELINE_SCRIPT_SRC } from '../components/XTimeline/constants'
import { HONOR_IMAGE_BASE_URL } from './honors'

/**
 * Content-Security-Policy で許可する、環境変数に依存しない外部オリジン。
 *
 * 環境ごとに変わる API・静的データ・ドキュメント・ジャケット画像・Firebase authDomain は
 * ビルド時に環境変数から追加する。
 */

/** Google Fonts のスタイルシート配信元。 */
const GOOGLE_FONTS_STYLESHEET_ORIGIN = 'https://fonts.googleapis.com'
/** Google Fonts のフォントファイル配信元。 */
const GOOGLE_FONTS_FILE_ORIGIN = 'https://fonts.gstatic.com'
/** Cloudflare Turnstile のスクリプトとウィジェット iframe の配信元。 */
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'
/** X 埋め込みウィジェットのスクリプトと iframe の配信元。 */
const X_WIDGET_ORIGINS = [new URL(X_TIMELINE_SCRIPT_SRC).origin, 'https://platform.twitter.com']
/** X 埋め込みタイムラインの iframe 配信元。 */
const X_SYNDICATION_ORIGIN = 'https://syndication.twitter.com'
/** Firebase Auth のポップアップ認証で読み込まれる Google API スクリプトの配信元。 */
const GOOGLE_APIS_SCRIPT_ORIGIN = 'https://apis.google.com'
/** Firebase Analytics が読み込む gtag.js の配信元。 */
const GOOGLE_TAG_MANAGER_ORIGIN = 'https://*.googletagmanager.com'
/**
 * Cloudflare Web Analytics が自動で差し込むビーコンスクリプトの配信元。
 *
 * 計測データは同一オリジンの `/cdn-cgi/rum` へ送信されるため、`connect-src` への追加は不要。
 */
const CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com'
/** Firebase Analytics の計測送信先。 */
const GOOGLE_ANALYTICS_ORIGINS = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
]
/** Firebase Auth・Installations・Analytics 設定取得の API 配信元。 */
const FIREBASE_API_ORIGINS = [
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://firebaseinstallations.googleapis.com',
  'https://firebase.googleapis.com',
]
/** 称号画像の配信元。 */
const CHUNITHM_NET_ORIGIN = new URL(HONOR_IMAGE_BASE_URL).origin

/** `script-src` に追加する外部オリジン。 */
export const CSP_SCRIPT_ORIGINS = [
  TURNSTILE_ORIGIN,
  ...X_WIDGET_ORIGINS,
  GOOGLE_APIS_SCRIPT_ORIGIN,
  GOOGLE_TAG_MANAGER_ORIGIN,
  CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN,
]

/** `style-src` に追加する外部オリジン。 */
export const CSP_STYLE_ORIGINS = [GOOGLE_FONTS_STYLESHEET_ORIGIN]

/** `font-src` に追加する外部オリジン。 */
export const CSP_FONT_ORIGINS = [GOOGLE_FONTS_FILE_ORIGIN]

/** `img-src` に追加する外部オリジン。 */
export const CSP_IMAGE_ORIGINS = [
  CHUNITHM_NET_ORIGIN,
  GOOGLE_TAG_MANAGER_ORIGIN,
  ...GOOGLE_ANALYTICS_ORIGINS,
]

/**
 * `connect-src` に追加する外部オリジン。
 *
 * SnapDOM による画像化ではフォントと画像を fetch で埋め込むため、
 * Google Fonts と称号画像の配信元も含める。
 */
export const CSP_CONNECT_ORIGINS = [
  ...FIREBASE_API_ORIGINS,
  GOOGLE_TAG_MANAGER_ORIGIN,
  ...GOOGLE_ANALYTICS_ORIGINS,
  GOOGLE_FONTS_STYLESHEET_ORIGIN,
  GOOGLE_FONTS_FILE_ORIGIN,
  CHUNITHM_NET_ORIGIN,
]

/** `frame-src` に追加する外部オリジン。Firebase authDomain はビルド時に追加する。 */
export const CSP_FRAME_ORIGINS = [TURNSTILE_ORIGIN, ...X_WIDGET_ORIGINS, X_SYNDICATION_ORIGIN]

/**
 * 全ページで強制する Content-Security-Policy。
 *
 * 既存機能を壊さないことが明らかなディレクティブに限定する。
 */
export const ENFORCED_CONTENT_SECURITY_POLICY =
  "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"

/** 全ページに付与する、CSP 以外のセキュリティヘッダー。 */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<readonly [name: string, value: string]> = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
]
