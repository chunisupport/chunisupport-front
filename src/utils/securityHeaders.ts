import { createHash } from 'node:crypto'
import {
  CSP_CONNECT_ORIGINS,
  CSP_FONT_ORIGINS,
  CSP_FRAME_ORIGINS,
  CSP_IMAGE_ORIGINS,
  CSP_SCRIPT_ORIGINS,
  CSP_STYLE_ORIGINS,
  ENFORCED_CONTENT_SECURITY_POLICY,
  STATIC_SECURITY_HEADERS,
} from '../constants/contentSecurityPolicy'

/**
 * 環境ごとに異なる、CSP で許可する URL。
 *
 * @property backendUrl - バックエンド API のベース URL。
 * @property jacketBaseUrl - ジャケット画像のベース URL。
 * @property documentationUrl - お知らせ JSON を配信するドキュメントサイトのベース URL。
 * @property staticDataBaseUrls - レコード統計などの静的 JSON 配信元。未設定のものは undefined。
 * @property firebaseAuthDomain - Firebase Auth の authDomain（ホスト名）。
 * @property inlineScriptHashes - HTML 内のインライン script の CSP ハッシュ値。
 */
export type ContentSecurityPolicyOptions = {
  backendUrl: string
  jacketBaseUrl: string
  documentationUrl: string
  staticDataBaseUrls: ReadonlyArray<string | undefined>
  firebaseAuthDomain: string
  inlineScriptHashes: readonly string[]
}

/** 外部 src を持たないインライン script の本文を抽出するパターン。 */
const INLINE_SCRIPT_PATTERN = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g

/**
 * HTML 内のインライン script を CSP の `'sha256-…'` 形式のハッシュ値へ変換する。
 *
 * @param htmlList - ビルド済みの HTML の一覧。
 * @returns 重複を除いたハッシュ値の一覧。
 */
export const collectInlineScriptHashes = (htmlList: readonly string[]): string[] => {
  const hashes = htmlList
    .flatMap((html) => [...html.matchAll(INLINE_SCRIPT_PATTERN)])
    .map((match) => match[1] ?? '')
    .filter((content) => content.trim() !== '')
    .map((content) => `'sha256-${createHash('sha256').update(content).digest('base64')}'`)
  return [...new Set(hashes)]
}

/**
 * URL をオリジンへ変換する。未設定の場合は undefined を返す。
 *
 * @param url - 変換する URL。
 * @returns URL のオリジン。
 */
const toOrigin = (url: string | undefined): string | undefined =>
  url ? new URL(url).origin : undefined

/**
 * ディレクティブ名と許可するソースから CSP の1ディレクティブを組み立てる。
 *
 * @param name - ディレクティブ名。
 * @param sources - 許可するソース。undefined と重複は除外する。
 * @returns `name source1 source2` 形式の文字列。
 */
const directive = (name: string, sources: ReadonlyArray<string | undefined>): string =>
  [name, ...new Set(sources.filter((source) => source !== undefined))].join(' ')

/**
 * 違反の収集用に Report-Only で配信する Content-Security-Policy を組み立てる。
 *
 * 違反の送信先（report-to）は未設定のため、違反はブラウザのコンソールでのみ確認できる。
 *
 * @param options - 環境ごとに異なる許可対象。
 * @returns CSP ヘッダーの値。
 */
export const buildReportOnlyContentSecurityPolicy = (
  options: ContentSecurityPolicyOptions
): string => {
  const backendOrigin = toOrigin(options.backendUrl)
  const jacketOrigin = toOrigin(options.jacketBaseUrl)
  const staticDataOrigins = options.staticDataBaseUrls.map(toOrigin)

  return [
    directive('default-src', ["'self'"]),
    directive('script-src', ["'self'", ...options.inlineScriptHashes, ...CSP_SCRIPT_ORIGINS]),
    directive('style-src', ["'self'", "'unsafe-inline'", ...CSP_STYLE_ORIGINS]),
    directive('font-src', ["'self'", 'data:', ...CSP_FONT_ORIGINS]),
    directive('img-src', ["'self'", 'data:', 'blob:', jacketOrigin, ...CSP_IMAGE_ORIGINS]),
    directive('connect-src', [
      "'self'",
      backendOrigin,
      jacketOrigin,
      toOrigin(options.documentationUrl),
      ...staticDataOrigins,
      ...CSP_CONNECT_ORIGINS,
    ]),
    directive('frame-src', [`https://${options.firebaseAuthDomain}`, ...CSP_FRAME_ORIGINS]),
    directive('worker-src', ["'self'", 'blob:']),
    directive('form-action', ["'self'"]),
    directive('object-src', ["'none'"]),
    directive('base-uri', ["'self'"]),
    directive('frame-ancestors', ["'none'"]),
  ].join('; ')
}

/**
 * Cloudflare Pages の `_headers` に追記する、全ページ共通のセキュリティヘッダー規則を組み立てる。
 *
 * @param options - Report-Only CSP の環境ごとに異なる許可対象。
 * @returns `/*` に対するヘッダー規則の文字列（末尾改行付き）。
 */
export const createSecurityHeadersRule = (options: ContentSecurityPolicyOptions): string => {
  const headers: Array<readonly [string, string]> = [
    ...STATIC_SECURITY_HEADERS,
    ['Content-Security-Policy', ENFORCED_CONTENT_SECURITY_POLICY],
    ['Content-Security-Policy-Report-Only', buildReportOnlyContentSecurityPolicy(options)],
  ]
  return ['/*', ...headers.map(([name, value]) => `  ${name}: ${value}`), ''].join('\n')
}
