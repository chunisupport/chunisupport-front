/**
 * Cloudflare Pages の `_headers` から Early Hints（103）を出すための Link 規則。
 *
 * ハッシュ付きアセット名はビルドごとに変わるため、`dist/index.html` の初期参照から生成する。
 * Pages は `_headers` の `rel=preload` / `rel=preconnect` を 103 として先行送信する。
 */

/** Cloudflare Pages の `_headers` で、1行に書ける最大文字数。 */
export const CLOUDFLARE_PAGES_HEADER_LINE_LIMIT = 2000

/** Cloudflare Pages の `_headers` で定義できる規則の最大数。 */
export const CLOUDFLARE_PAGES_HEADER_RULE_LIMIT = 100

/**
 * HTML 応答へ Link を付けるパス。
 *
 * セキュリティヘッダーと同じ `/*` であり、`/`、固定ページ、SPA フォールバックを含む。
 * `/` へ同じ Link を重ねると、複数規則に一致したヘッダー値がカンマ結合されて重複する。
 */
export const HTML_RESPONSE_HEADER_PATH = '/*'

/**
 * 既存の Cache-Control 規則と同じ、非 HTML のパス。
 *
 * Link は別規則の `! Link` で外し、Cache-Control の行自体は変更しない。
 */
export const BASE_NON_HTML_HEADER_PATHS = ['/static/*', '/version.json', '/favicon.*.png'] as const

const ELEMENT_PATTERN = /<(script|link)\b([^>]*)>/gi
const STATIC_ASSET_PATH_PATTERN = /^\/static\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/

type AssetKind = 'style' | 'script'
type CrossOriginMode = 'anonymous' | 'use-credentials'

type StaticAsset = {
  href: string
  kind: AssetKind
  crossOrigin: CrossOriginMode | undefined
}

/**
 * 開始タグの属性文字列から、指定した属性の値を取り出す。
 *
 * 値のないブール属性は空文字、属性が無い場合は undefined を返す。
 *
 * @param attributes - タグ名より後ろの属性文字列。
 * @param name - 属性名。
 * @returns 属性値。
 */
const readAttribute = (attributes: string, name: string): string | undefined => {
  const pattern = new RegExp(
    `(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))|(?=\\s|$))`,
    'i'
  )
  const match = pattern.exec(attributes)
  if (!match) return undefined
  return match[1] ?? match[2] ?? match[3] ?? ''
}

/**
 * `crossorigin` 属性を、preload が実リクエストと一致するモードへ正規化する。
 *
 * @param value - 属性値。属性が無い場合は undefined。
 * @returns CORS モード。属性が無い場合は undefined。
 */
const readCrossOriginMode = (value: string | undefined): CrossOriginMode | undefined => {
  if (value === undefined) return undefined
  const normalized = value.toLowerCase()
  if (normalized === '' || normalized === 'anonymous') return 'anonymous'
  if (normalized === 'use-credentials') return 'use-credentials'
  throw new Error(`crossorigin の値が不正です: ${value}`)
}

/**
 * `/static/` 配下の初期アセットパスとして `_headers` に埋め込めるかを確認する。
 *
 * @param href - HTML が参照しているパス。
 * @param kind - スタイルシートかスクリプトか。
 * @returns 検証済みのパス。
 */
const assertStaticAssetPath = (href: string, kind: AssetKind): string => {
  const pathname = href.split(/[?#]/, 1)[0] ?? href
  if (pathname !== href) {
    throw new Error(`初期アセットのパスにクエリやハッシュは使えません: ${href}`)
  }
  if (!STATIC_ASSET_PATH_PATTERN.test(pathname) || pathname.split('/').includes('..')) {
    throw new Error(`初期アセットのパスが /static/ 配下ではありません: ${href}`)
  }
  const expectedExtension = kind === 'style' ? '.css' : '.js'
  if (!pathname.endsWith(expectedExtension)) {
    throw new Error(`初期アセットの拡張子が ${expectedExtension} ではありません: ${href}`)
  }
  return pathname
}

/**
 * preload の Link 値を組み立てる。
 *
 * 実タグに `crossorigin` があるときだけ同じモードを付け、同一オリジンの通常読み込みと CORS モードをずらさない。
 *
 * @param asset - 初期 HTML が参照する静的アセット。
 * @returns `Link` ヘッダーの値。
 */
const formatPreloadLinkValue = (asset: StaticAsset): string => {
  const crossOrigin =
    asset.crossOrigin === 'use-credentials'
      ? '; crossorigin=use-credentials'
      : asset.crossOrigin === 'anonymous'
        ? '; crossorigin'
        : ''
  const as = asset.kind === 'style' ? 'style' : 'script'
  return `<${asset.href}>; rel=preload; as=${as}${crossOrigin}`
}

/**
 * `dist/index.html` から、初期表示で読み込む `/static/` 配下の CSS と JS の Link 値を抽出する。
 *
 * `script src` と `link rel=stylesheet` だけを対象にする。外部のフォント配信元、アイコン、外部 URL は含めない。
 * `/static/` へ切り出したフォント CSS は初期スタイルシートとして含め、HTML より先に preload する。
 * レンダリングをブロックする CSS を先に、スクリプトは HTML 上の順で続ける。
 *
 * @param html - ビルド済みの初期 HTML。
 * @returns `rel=preload` の Link 値。CSS、JS の順。
 */
export const collectInitialStaticAssetLinkValues = (html: string): string[] => {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '')
  const assets: StaticAsset[] = []

  for (const match of withoutComments.matchAll(ELEMENT_PATTERN)) {
    const tagName = match[1]?.toLowerCase()
    const attributes = match[2] ?? ''
    const kind: AssetKind | undefined =
      tagName === 'link' &&
      readAttribute(attributes, 'rel')?.toLowerCase().split(/\s+/).includes('stylesheet')
        ? 'style'
        : tagName === 'script' && readAttribute(attributes, 'src') !== undefined
          ? 'script'
          : undefined
    if (!kind) continue

    const href = readAttribute(attributes, kind === 'style' ? 'href' : 'src')
    if (!href?.startsWith('/static/')) continue

    assets.push({
      href: assertStaticAssetPath(href, kind),
      kind,
      crossOrigin: readCrossOriginMode(readAttribute(attributes, 'crossorigin')),
    })
  }

  const unique: StaticAsset[] = []
  for (const asset of assets) {
    const existing = unique.find((item) => item.href === asset.href && item.kind === asset.kind)
    if (!existing) {
      unique.push(asset)
      continue
    }
    if (existing.crossOrigin !== asset.crossOrigin) {
      throw new Error(`同じ初期アセットの crossorigin が一致しません: ${asset.href}`)
    }
  }

  return [
    ...unique.filter((asset) => asset.kind === 'style'),
    ...unique.filter((asset) => asset.kind === 'script'),
  ].map(formatPreloadLinkValue)
}

/**
 * API オリジンへの preconnect の Link 値を組み立てる。
 *
 * `fetchApi` / `fetchWithAuth` は `credentials` を指定しない。既定の `same-origin` では、
 * 別オリジンの API へ Cookie を送らず、モードは CORS の anonymous になる。
 * そのため `crossorigin=use-credentials` ではなく、anonymous の `crossorigin` を付ける。
 * 未設定・空白の場合は Link を作らない。
 *
 * @param backendUrl - `PUBLIC_BACKEND_URL`。パスが含まれていてもオリジンだけを使う。
 * @returns `rel=preconnect` の Link 値。不要な場合は undefined。
 */
export const createApiPreconnectLinkValue = (
  backendUrl: string | undefined
): string | undefined => {
  if (backendUrl === undefined || backendUrl.trim() === '') return undefined

  let origin: string
  try {
    origin = new URL(backendUrl).origin
  } catch {
    throw new Error(`PUBLIC_BACKEND_URL が URL として不正です: ${backendUrl}`)
  }
  if (origin === 'null') {
    throw new Error(`PUBLIC_BACKEND_URL のオリジンを解決できません: ${backendUrl}`)
  }

  return `<${origin}>; rel=preconnect; crossorigin`
}

/**
 * 単一の `*` を含む Cloudflare Pages のパスパターンに一致するかを判定する。
 *
 * @param pattern - `*` を最大1つ含むパスパターン。
 * @param value - 比較する具体的なパス。
 * @returns 一致する場合は true。
 */
const matchesHeaderPath = (pattern: string, value: string): boolean => {
  const starIndex = pattern.indexOf('*')
  if (starIndex === -1) return pattern === value
  if (pattern.indexOf('*', starIndex + 1) !== -1) {
    throw new Error(`_headers のパスに * は1つまでです: ${pattern}`)
  }

  const prefix = pattern.slice(0, starIndex)
  const suffix = pattern.slice(starIndex + 1)
  return (
    value.length >= prefix.length + suffix.length &&
    value.startsWith(prefix) &&
    value.endsWith(suffix)
  )
}

/**
 * Link を外す非 HTML パスを、既存の Cache-Control 規則と dist 内のファイルから集める。
 *
 * `/static/*` に含まれるファイルは個別に列挙しない。HTML、`_headers`、`_redirects` は対象外。
 *
 * @param relativePosixPaths - `dist` からの相対パス。区切りは `/`。
 * @returns `_headers` に書くパス。既存パターン、その後に辞書順の追加パス。
 */
export const collectNonHtmlHeaderPaths = (relativePosixPaths: readonly string[]): string[] => {
  const extras = relativePosixPaths
    .filter((relativePath) => {
      if (relativePath === '' || relativePath.endsWith('.html')) return false
      if (relativePath === '_headers' || relativePath === '_redirects') return false
      if (relativePath === 'static' || relativePath.startsWith('static/')) return false
      return !relativePath.split('/').includes('..')
    })
    .map((relativePath) => `/${relativePath}`)
    .filter(
      (headerPath) =>
        !BASE_NON_HTML_HEADER_PATHS.some((pattern) => matchesHeaderPath(pattern, headerPath))
    )
    .sort()

  return [...BASE_NON_HTML_HEADER_PATHS, ...new Set(extras)]
}

/**
 * `_headers` の規則数を数える。
 *
 * インデントされていない、コメント以外の行を1規則とみなす。
 *
 * @param headersFile - `_headers` の全文。
 * @returns 規則数。
 */
export const countCloudflareHeaderRules = (headersFile: string): number =>
  headersFile.split('\n').filter((line) => {
    const trimmed = line.trim()
    return (
      trimmed !== '' && !trimmed.startsWith('#') && !line.startsWith(' ') && !line.startsWith('\t')
    )
  }).length

/**
 * Early Hints 用の `_headers` 断片を組み立てる。
 *
 * 同一パスには Link を1行ずつ書く。非 HTML のパスでは `! Link` だけを追加し、
 * 既存の Cache-Control やセキュリティヘッダーは書き換えない。
 *
 * @param options.html - `dist/index.html` の本文。
 * @param options.backendUrl - `PUBLIC_BACKEND_URL`。未設定なら preconnect を付けない。
 * @param options.nonHtmlPaths - Link を外す非 HTML のパス。
 * @returns 末尾改行付きの `_headers` 断片。
 */
export const createEarlyHintsHeaderRules = (options: {
  html: string
  backendUrl: string | undefined
  nonHtmlPaths: readonly string[]
}): string => {
  const assetLinks = collectInitialStaticAssetLinkValues(options.html)
  if (!assetLinks.some((link) => link.includes('as=style'))) {
    throw new Error('dist/index.html から初期表示の CSS を抽出できません。')
  }
  if (!assetLinks.some((link) => link.includes('as=script'))) {
    throw new Error('dist/index.html から初期表示の JS を抽出できません。')
  }

  const preconnect = createApiPreconnectLinkValue(options.backendUrl)
  const linkValues = preconnect ? [...assetLinks, preconnect] : assetLinks
  const nonHtmlPaths = [...new Set(options.nonHtmlPaths)]
  if (
    nonHtmlPaths.some(
      (headerPath) => headerPath === HTML_RESPONSE_HEADER_PATH || headerPath === '/'
    )
  ) {
    throw new Error('HTML 応答のパスから Link は外せません。')
  }

  const lines = [
    '# 初期表示の CSS / JS と API オリジン向け Early Hints。',
    '# scripts/generate-early-hints.mjs が dist/index.html から生成する。',
    '# `/*` は `/`、固定ページ、SPA フォールバックを含む HTML 応答に一致する。',
    '# 同じ Link を `/` と `/*` の両方へ書くと Pages が値をカンマ結合して重複するため、`/*` のみに書く。',
    HTML_RESPONSE_HEADER_PATH,
    ...linkValues.map((linkValue) => `  Link: ${linkValue}`),
    '',
    '# 非 HTML の応答から Link を外す。Cache-Control などの既存ヘッダーは変更しない。',
    ...nonHtmlPaths.flatMap((headerPath) => [headerPath, '  ! Link', '']),
  ]

  for (const line of lines) {
    if (line.length > CLOUDFLARE_PAGES_HEADER_LINE_LIMIT) {
      throw new Error(
        `_headers の1行が ${CLOUDFLARE_PAGES_HEADER_LINE_LIMIT} 文字を超えています: ${line.slice(0, 80)}`
      )
    }
  }

  return `${lines.join('\n')}`
}
