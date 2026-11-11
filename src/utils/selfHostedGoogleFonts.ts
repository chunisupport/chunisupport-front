import { createHash } from 'node:crypto'

/**
 * Google Fonts のスタイルシートを、同一オリジンのハッシュ付き CSS と woff2 へ移す。
 *
 * Cloudflare Fonts は HTML 内の `fonts.googleapis.com` の link を見つけ、`@font-face` を
 * 応答へインラインする。HTML は再検証必須で ETag もないため、その CSS が訪問ごとに再取得される。
 * ビルド時に同じスタイルシートと woff2 を取り込み、`/static/` の既存の immutable 規則へ載せる。
 */

/** favicon や Rsbuild の出力に合わせた、コンテンツハッシュの文字数。 */
export const CONTENT_HASH_LENGTH = 10

/** 画面のフォールバックチェーンが参照するファミリー。欠けていればビルドを止める。 */
export const REQUIRED_FONT_FAMILIES = ['Jost', 'Noto Sans', 'Noto Sans JP', 'Oswald'] as const

const GOOGLE_FONTS_STYLESHEET_ORIGIN = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILE_ORIGIN = 'https://fonts.gstatic.com'
const FONT_FILE_PATH_PATTERN = new RegExp(
  `^/static/fonts/[a-f0-9]{${CONTENT_HASH_LENGTH}}\\.woff2$`
)
const FONT_STYLESHEET_PATH_PATTERN = new RegExp(
  `^/static/css/fonts\\.[a-f0-9]{${CONTENT_HASH_LENGTH}}\\.css$`
)
/**
 * モジュールで共有するグローバル正規表現。
 *
 * `matchAll` や `replace` の前に `lastIndex` を 0 に戻す。
 */
const LINK_TAG_PATTERN = /<link\b[^>]*>/gi
const FONT_FACE_PATTERN = /@font-face\s*\{([^}]*)\}/g
const URL_FUNCTION_PATTERN = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"'\s]+))\s*\)/g
const VARIABLE_FONT_WEIGHT_PATTERN = /^\d{3} \d{3}$/

/**
 * ファイル内容からキャッシュバスティング用の短縮ハッシュを生成する。
 *
 * @param content - ハッシュ対象のバイト列または文字列。
 * @returns SHA-256 の先頭から切り出したハッシュ。
 */
export const createContentHash = (content: Uint8Array | string): string =>
  createHash('sha256').update(content).digest('hex').slice(0, CONTENT_HASH_LENGTH)

/**
 * woff2 の内容に対応するファイル名を返す。
 *
 * @param content - woff2 のバイト列。
 * @returns `/static/fonts/` へ置くファイル名。
 */
export const createFontFileName = (content: Uint8Array): string =>
  `${createContentHash(content)}.woff2`

/**
 * フォント CSS の内容に対応するファイル名を返す。
 *
 * @param css - 同一オリジンの URL へ書き換えた後の CSS。
 * @returns `/static/css/` へ置くファイル名。
 */
export const createFontStylesheetName = (css: string): string =>
  `fonts.${createContentHash(css)}.css`

/**
 * 開始タグから属性値を取り出す。
 *
 * 値のない属性は空文字、属性が無い場合は undefined を返す。
 *
 * @param tag - 開始タグ全体。
 * @param name - 属性名。
 * @returns 属性値。
 */
const readAttribute = (tag: string, name: string): string | undefined => {
  const pattern = new RegExp(
    `(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))|(?=[\\s>/]|$))`,
    'i'
  )
  const match = pattern.exec(tag)
  if (!match) return undefined
  return match[1] ?? match[2] ?? match[3] ?? ''
}

/**
 * HTML 属性値の実体参照を、URL として解釈できる文字列へ戻す。
 *
 * @param value - 属性値。
 * @returns デコードした文字列。
 */
const decodeHtmlAttribute = (value: string): string =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

/**
 * CSS 宣言ブロックから、指定したプロパティの値を取り出す。
 *
 * @param block - `@font-face` の中身。
 * @param property - プロパティ名。
 * @returns 前後の空白を畳んだ値。無い場合は undefined。
 */
const readDeclaration = (block: string, property: string): string | undefined => {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i').exec(block)
  const value = match?.[1]?.trim().replace(/\s+/g, ' ')
  return value === '' ? undefined : value
}

/**
 * `font-family` の引用符を外してファミリー名を返す。
 *
 * @param block - `@font-face` の中身。
 * @returns ファミリー名。
 */
const readFontFamily = (block: string): string => {
  const value = readDeclaration(block, 'font-family')
  if (!value) {
    throw new Error('Google Fonts の CSS に font-family がありません。')
  }
  const quoted = /^(['"])(.*)\1$/.exec(value)
  return quoted?.[2] ?? value
}

/**
 * `url()` の中身を、出現順に取り出す。
 *
 * @param block - CSS の断片。
 * @returns URL の一覧。
 */
const readUrls = (block: string): string[] => {
  URL_FUNCTION_PATTERN.lastIndex = 0
  return [...block.matchAll(URL_FUNCTION_PATTERN)].map(
    (match) => match[1] ?? match[2] ?? match[3] ?? ''
  )
}

/**
 * Google Fonts が返す woff2 の URL であることを確認する。
 *
 * @param url - `src` の URL。
 */
const assertGoogleFontFileUrl = (url: string): void => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`フォントファイルの URL が不正です: ${url}`)
  }
  if (parsed.origin !== GOOGLE_FONTS_FILE_ORIGIN) {
    throw new Error(`フォントファイルの配信元が fonts.gstatic.com ではありません: ${url}`)
  }
  if (!parsed.pathname.endsWith('.woff2') || parsed.search !== '' || parsed.hash !== '') {
    throw new Error(`フォントファイルがクエリなしの woff2 ではありません: ${url}`)
  }
}

/**
 * スタイルシートから、取り込む woff2 の URL を出現順に返す。
 *
 * ファミリー、可変ウェイト、`font-display: swap`、unicode-range が欠けている CSS は拒否する。
 *
 * @param css - Google Fonts のスタイルシート。
 * @returns 重複を除いた woff2 の URL。
 */
export const collectGoogleFontFileUrls = (css: string): string[] => {
  FONT_FACE_PATTERN.lastIndex = 0
  URL_FUNCTION_PATTERN.lastIndex = 0
  if (/@import\b/i.test(css)) {
    throw new Error('Google Fonts の CSS に @import が含まれています。')
  }

  const faces = [...css.matchAll(FONT_FACE_PATTERN)]
  if (faces.length === 0) {
    throw new Error('Google Fonts の CSS に @font-face がありません。')
  }

  const families = new Set<string>()
  const urls: string[] = []
  const seen = new Set<string>()

  for (const face of faces) {
    const block = face[1] ?? ''
    const family = readFontFamily(block)
    families.add(family)

    const style = readDeclaration(block, 'font-style')
    if (style !== 'normal' && style !== 'italic') {
      throw new Error(`font-style が不正です: ${style ?? '(なし)'}`)
    }
    const weight = readDeclaration(block, 'font-weight')
    if (!weight || !VARIABLE_FONT_WEIGHT_PATTERN.test(weight)) {
      throw new Error(`可変ウェイトではありません: ${weight ?? '(なし)'}`)
    }
    if (readDeclaration(block, 'font-display') !== 'swap') {
      throw new Error('font-display が swap ではありません。')
    }
    const unicodeRange = readDeclaration(block, 'unicode-range')
    if (!unicodeRange?.startsWith('U+')) {
      throw new Error('unicode-range がありません。')
    }
    if (/format\(\s*['"](?!woff2['"])/.test(block)) {
      throw new Error('woff2 以外の format() が含まれています。')
    }

    const faceUrls = readUrls(block)
    if (faceUrls.length !== 1) {
      throw new Error(`@font-face の url() が1つではありません: ${family}`)
    }
    const url = faceUrls[0] ?? ''
    assertGoogleFontFileUrl(url)
    if (!seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  for (const family of REQUIRED_FONT_FAMILIES) {
    if (!families.has(family)) {
      throw new Error(`Google Fonts の CSS に ${family} がありません。`)
    }
  }

  const outsideUrls = readUrls(css).filter((url) => !seen.has(url))
  if (outsideUrls.length > 0) {
    throw new Error(`@font-face の外に url() があります: ${outsideUrls[0]}`)
  }

  return urls
}

/**
 * Google Fonts の CSS 内の woff2 URL を、同一オリジンのパスへ置き換える。
 *
 * ファミリー、ウェイト、unicode-range、`font-display` の記述は変えない。
 *
 * @param css - Google Fonts のスタイルシート。
 * @param localPathBySourceUrl - 取得元 URL から `/static/fonts/<hash>.woff2` への対応。
 * @returns 外部 URL を含まない CSS。
 */
export const rewriteGoogleFontsStylesheet = (
  css: string,
  localPathBySourceUrl: ReadonlyMap<string, string>
): string => {
  const sourceUrls = collectGoogleFontFileUrls(css)
  let rewritten = css

  for (const sourceUrl of [...sourceUrls].sort((left, right) => right.length - left.length)) {
    const localPath = localPathBySourceUrl.get(sourceUrl)
    if (localPath === undefined) {
      throw new Error(`フォントファイルの出力パスがありません: ${sourceUrl}`)
    }
    if (!FONT_FILE_PATH_PATTERN.test(localPath)) {
      throw new Error(`フォントファイルの出力パスが /static/fonts/ ではありません: ${localPath}`)
    }

    const replacements = [
      [`url(${sourceUrl})`, `url(${localPath})`],
      [`url("${sourceUrl}")`, `url("${localPath}")`],
      [`url('${sourceUrl}')`, `url('${localPath}')`],
    ]
    const next = replacements.reduce(
      (current, [from, to]) => (current.includes(from) ? current.replaceAll(from, to) : current),
      rewritten
    )
    if (next === rewritten) {
      throw new Error(`フォントファイルの URL を置換できません: ${sourceUrl}`)
    }
    rewritten = next
  }

  if (/https?:\/\//.test(rewritten)) {
    throw new Error('書き換え後のフォント CSS に外部 URL が残っています。')
  }
  if ((css.match(/@font-face/g) ?? []).length !== (rewritten.match(/@font-face/g) ?? []).length) {
    throw new Error('書き換え後の @font-face の数が変わりました。')
  }

  return rewritten
}

/**
 * link の `rel` を空白区切りのトークンへ正規化する。
 *
 * @param tag - link の開始タグ。
 * @returns 小文字の rel トークン。
 */
const readRelTokens = (tag: string): string[] =>
  (readAttribute(tag, 'rel') ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token !== '')

/**
 * Google Fonts への preconnect かどうかを判定する。
 *
 * @param href - link の href。
 * @returns `fonts.googleapis.com` または `fonts.gstatic.com` の場合は true。
 */
const isGoogleFontsPreconnect = (href: string): boolean => {
  try {
    const origin = new URL(href).origin
    return origin === GOOGLE_FONTS_STYLESHEET_ORIGIN || origin === GOOGLE_FONTS_FILE_ORIGIN
  } catch {
    return false
  }
}

/**
 * ビルド済み HTML から、Google Fonts のスタイルシート URL を1つ取り出す。
 *
 * @param html - Rsbuild が出力した HTML。
 * @returns `fonts.googleapis.com` のスタイルシート URL。
 */
export const extractGoogleFontsStylesheetUrl = (html: string): string => {
  LINK_TAG_PATTERN.lastIndex = 0
  const hrefs = [...html.matchAll(LINK_TAG_PATTERN)].flatMap((match) => {
    const tag = match[0]
    if (!readRelTokens(tag).includes('stylesheet')) return []
    const href = decodeHtmlAttribute(readAttribute(tag, 'href') ?? '')
    return href.startsWith(`${GOOGLE_FONTS_STYLESHEET_ORIGIN}/`) ? [href] : []
  })

  if (hrefs.length !== 1) {
    throw new Error(`Google Fonts のスタイルシート link が1つではありません: ${hrefs.length}件`)
  }
  return hrefs[0] ?? ''
}

/**
 * Google Fonts の preconnect とスタイルシート link を、同一オリジンの CSS 参照へ置き換える。
 *
 * preload は HTML を解析した時点で取得を始め、スタイルシート本体は描画をブロックする他の CSS と同じく
 * Early Hints の対象になる。`fonts.googleapis.com` を残すと Cloudflare Fonts が再びインラインする。
 *
 * @param html - Rsbuild が出力した HTML。
 * @param stylesheetHref - `/static/css/fonts.<hash>.css`。
 * @returns Google Fonts の URL を含まない HTML。
 */
export const replaceGoogleFontsHtmlLinks = (html: string, stylesheetHref: string): string => {
  if (!FONT_STYLESHEET_PATH_PATTERN.test(stylesheetHref)) {
    throw new Error(`フォント CSS のパスが不正です: ${stylesheetHref}`)
  }

  let foundStylesheet = false
  LINK_TAG_PATTERN.lastIndex = 0
  const next = html.replace(LINK_TAG_PATTERN, (tag) => {
    const relTokens = readRelTokens(tag)
    const href = decodeHtmlAttribute(readAttribute(tag, 'href') ?? '')

    if (relTokens.includes('preconnect') && isGoogleFontsPreconnect(href)) {
      return ''
    }
    if (relTokens.includes('stylesheet') && href.startsWith(`${GOOGLE_FONTS_STYLESHEET_ORIGIN}/`)) {
      if (foundStylesheet) {
        throw new Error('Google Fonts のスタイルシート link が複数あります。')
      }
      foundStylesheet = true
      return (
        `<link rel="preload" href="${stylesheetHref}" as="style">` +
        `<link rel="stylesheet" href="${stylesheetHref}">`
      )
    }
    return tag
  })

  if (!foundStylesheet) {
    throw new Error('Google Fonts のスタイルシート link が見つかりません。')
  }
  if (next.includes(GOOGLE_FONTS_STYLESHEET_ORIGIN) || next.includes(GOOGLE_FONTS_FILE_ORIGIN)) {
    throw new Error('HTML に Google Fonts の URL が残っています。')
  }

  return next
}
