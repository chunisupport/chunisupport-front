import path from 'node:path'

/**
 * 固定ページ HTML の head に埋め込むメタ情報。
 *
 * @property title - サービス名を含むドキュメントタイトル。
 * @property description - ページの用途を表す説明文。
 * @property canonicalUrl - ページの正規 URL。
 * @property imageUrl - OGP と Twitter Card で使用する画像 URL。
 */
export type StaticPageHtmlMetadata = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
}

const TITLE_PATTERN = /<title>[^<]*<\/title>/g
const HEAD_END_PATTERN = /<\/head>/g

/**
 * 固定ページの URL パスをビルド成果物の HTML パスへ変換する。
 *
 * @param distDirectory - Rsbuild の出力ディレクトリ。
 * @param pagePath - 先頭スラッシュを含み末尾スラッシュを含まないページパス。
 * @returns 固定ページに対応する HTML の絶対パス。
 */
export const resolveStaticPageOutputPath = (distDirectory: string, pagePath: string): string => {
  if (pagePath === '/') {
    return path.join(distDirectory, 'root-ogp.html')
  }
  if (
    !pagePath.startsWith('/') ||
    pagePath.endsWith('/') ||
    pagePath.includes('?') ||
    pagePath.includes('#') ||
    pagePath.split('/').includes('..')
  ) {
    throw new Error(`固定ページのパスが不正です: ${pagePath}`)
  }

  const outputPath = path.resolve(distDirectory, `${pagePath.slice(1)}.html`)
  const relativePath = path.relative(distDirectory, outputPath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`固定ページの出力先が dist の外側です: ${pagePath}`)
  }
  return outputPath
}

/**
 * HTML のテキストおよび属性値へ埋め込めるよう特殊文字をエスケープする。
 *
 * @param value - HTML へ埋め込む文字列。
 * @returns HTML エスケープ済みの文字列。
 */
const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/**
 * 指定したパスを HTTP(S) の絶対 URL として解決する。
 *
 * @param path - ベース URL を基準に解決するパス。
 * @param baseUrl - 公開サイトのベース URL。
 * @returns 正規化された HTTP(S) の絶対 URL。
 */
export const resolvePublicUrl = (path: string, baseUrl: string): string => {
  const url = new URL(path, baseUrl)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('PUBLIC_FRONTEND_URL は HTTP(S) の絶対 URL で指定してください。')
  }
  return url.href
}

/**
 * Rsbuild が生成した HTML から、固定ページ用の初期 HTML を生成する。
 *
 * @param template - OGP を含まない Rsbuild の HTML。
 * @param metadata - 固定ページへ埋め込むメタ情報。
 * @returns title、description、OGP、Twitter Card、canonical を含む HTML。
 */
export const createStaticPageHtml = (
  template: string,
  metadata: StaticPageHtmlMetadata
): string => {
  const titleMatches = template.match(TITLE_PATTERN) ?? []
  const headEndMatches = template.match(HEAD_END_PATTERN) ?? []

  if (titleMatches.length !== 1) {
    throw new Error('HTML 内の title 要素を一意に特定できません。')
  }
  if (headEndMatches.length !== 1) {
    throw new Error('HTML 内の head 終了タグを一意に特定できません。')
  }

  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonicalUrl = escapeHtml(metadata.canonicalUrl)
  const imageUrl = escapeHtml(metadata.imageUrl)
  const tags = [
    `    <meta name="description" content="${description}">`,
    `    <link rel="canonical" href="${canonicalUrl}">`,
    '    <meta property="og:site_name" content="ChuniSupport">',
    `    <meta property="og:title" content="${title}">`,
    `    <meta property="og:description" content="${description}">`,
    `    <meta property="og:url" content="${canonicalUrl}">`,
    `    <meta property="og:image" content="${imageUrl}">`,
    '    <meta property="og:type" content="website">',
    '    <meta name="twitter:card" content="summary_large_image">',
    `    <meta name="twitter:title" content="${title}">`,
    `    <meta name="twitter:description" content="${description}">`,
    `    <meta name="twitter:image" content="${imageUrl}">`,
  ].join('\n')

  return template
    .replace(TITLE_PATTERN, `<title>${title}</title>`)
    .replace(HEAD_END_PATTERN, `${tags}\n  </head>`)
}
