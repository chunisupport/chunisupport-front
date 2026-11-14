import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectGoogleFontFileUrls,
  createFontFileName,
  createFontStylesheetName,
  extractGoogleFontsStylesheetUrl,
  replaceGoogleFontsHtmlLinks,
  rewriteGoogleFontsStylesheet,
} from './selfHostedGoogleFonts'

const JOST_LATIN = 'https://fonts.gstatic.com/s/jost/v20/latin.woff2'
const JOST_LATIN_EXT = 'https://fonts.gstatic.com/s/jost/v20/latin-ext.woff2'
const NOTO_SANS = 'https://fonts.gstatic.com/s/notosans/v36/latin.woff2'
const NOTO_SANS_JP = 'https://fonts.gstatic.com/s/notosansjp/v53/latin.woff2'
const OSWALD = 'https://fonts.gstatic.com/s/oswald/v53/latin.woff2'

const FONT_CSS = `/* latin */
@font-face {
  font-family: 'Jost';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(${JOST_LATIN}) format('woff2');
  unicode-range: U+0000-00FF, U+0131;
}
@font-face {
  font-family: 'Jost';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url(${JOST_LATIN_EXT}) format('woff2');
  unicode-range: U+0100-02BA;
}
@font-face {
  font-family: 'Noto Sans';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url(${NOTO_SANS}) format('woff2');
  unicode-range: U+0000-00FF;
}
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url("${NOTO_SANS_JP}") format('woff2');
  unicode-range: U+3000-30FF;
}
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 200 700;
  font-display: swap;
  src: url('${OSWALD}') format('woff2');
  unicode-range: U+0000-00FF;
}
`

const LOCAL_PATHS = new Map([
  [JOST_LATIN, '/static/fonts/aaaaaaaaaa.woff2'],
  [JOST_LATIN_EXT, '/static/fonts/bbbbbbbbbb.woff2'],
  [NOTO_SANS, '/static/fonts/cccccccccc.woff2'],
  [NOTO_SANS_JP, '/static/fonts/dddddddddd.woff2'],
  [OSWALD, '/static/fonts/eeeeeeeeee.woff2'],
])

const STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Jost&amp;family=Noto+Sans&display=swap'

/** フォントバイナリの内容に応じた命名を検証する。 */
test('woff2は同じ内容なら同じ名前になり、異なる内容なら名前が変わること', () => {
  // Given
  const first = new TextEncoder().encode('woff2-a')
  const second = new TextEncoder().encode('woff2-b')

  // When
  const firstName = createFontFileName(first)

  // Then
  assert.equal(firstName, createFontFileName(first))
  assert.match(firstName, /^[a-f0-9]{10}\.woff2$/)
  assert.notEqual(firstName, createFontFileName(second))
})

/** CSSの内容に応じた命名と拡張子を検証する。 */
test('CSSは同じ内容なら同じ名前になり、異なる内容なら名前が変わること', () => {
  // Given: 内容が異なる2つのCSS。
  const first = 'font-face'
  const second = 'font-face-changed'

  // When: CSSのファイル名を生成する。
  const name = createFontStylesheetName(first)

  // Then: 内容が名前へ反映される。
  assert.equal(name, createFontStylesheetName(first))
  assert.notEqual(name, createFontStylesheetName(second))
  assert.match(name, /^fonts\.[a-f0-9]{10}\.css$/)
})

test('Google Fonts の CSS から woff2 を出現順に取り出すこと', () => {
  // Given
  const css = FONT_CSS

  // When
  const urls = collectGoogleFontFileUrls(css)

  // Then
  assert.deepEqual(urls, [JOST_LATIN, JOST_LATIN_EXT, NOTO_SANS, NOTO_SANS_JP, OSWALD])
})

test('font-display が swap でない CSS は拒否すること', () => {
  // Given
  const css = FONT_CSS.replace('font-display: swap;', 'font-display: block;')

  // When / Then
  assert.throws(() => collectGoogleFontFileUrls(css), /font-display が swap ではありません/)
})

test('必要なファミリーが欠けている CSS は拒否すること', () => {
  // Given
  const css = FONT_CSS.replaceAll("'Oswald'", "'Roboto'")

  // When / Then
  assert.throws(() => collectGoogleFontFileUrls(css), /Oswald がありません/)
})

test('woff2 以外の URL は拒否すること', () => {
  // Given
  const css = FONT_CSS.replace(OSWALD, 'https://fonts.gstatic.com/s/oswald/v53/latin.ttf')

  // When / Then
  assert.throws(() => collectGoogleFontFileUrls(css), /woff2 ではありません/)
})

test('URL の置換は unicode-range と font-display を保ち、長い URL を先に置き換えること', () => {
  // Given: 短い URL が長い URL の前置になる
  const shortUrl = 'https://fonts.gstatic.com/s/a.woff2'
  const longUrl = 'https://fonts.gstatic.com/s/a.woff2/more.woff2'
  const css = FONT_CSS.replace(JOST_LATIN, longUrl).replace(JOST_LATIN_EXT, shortUrl)
  const localPaths = new Map(LOCAL_PATHS)
  localPaths.set(longUrl, '/static/fonts/1111111111.woff2')
  localPaths.set(shortUrl, '/static/fonts/2222222222.woff2')
  localPaths.delete(JOST_LATIN)
  localPaths.delete(JOST_LATIN_EXT)

  // When
  const rewritten = rewriteGoogleFontsStylesheet(css, localPaths)

  // Then
  assert.equal(rewritten.includes('https://'), false)
  assert.equal(rewritten.includes('font-display: swap'), true)
  assert.equal(rewritten.includes('unicode-range: U+0000-00FF, U+0131;'), true)
  assert.equal(rewritten.includes('unicode-range: U+3000-30FF;'), true)
  assert.equal(rewritten.includes("font-family: 'Noto Sans JP'"), true)
  assert.equal(rewritten.includes('url(/static/fonts/1111111111.woff2)'), true)
  assert.equal(rewritten.includes('url(/static/fonts/2222222222.woff2)'), true)
  assert.equal(rewritten.includes('url("/static/fonts/dddddddddd.woff2")'), true)
  assert.equal(rewritten.includes("url('/static/fonts/eeeeeeeeee.woff2')"), true)
  assert.equal((rewritten.match(/@font-face/g) ?? []).length, 5)
})

test('出力パスが無い、または /static/fonts/ でない場合は失敗すること', () => {
  // Given
  const missing = new Map(LOCAL_PATHS)
  missing.delete(OSWALD)
  const invalid = new Map(LOCAL_PATHS)
  invalid.set(OSWALD, 'https://cdn.example/oswald.woff2')

  // When / Then
  assert.throws(() => rewriteGoogleFontsStylesheet(FONT_CSS, missing), /出力パスがありません/)
  assert.throws(
    () => rewriteGoogleFontsStylesheet(FONT_CSS, invalid),
    /\/static\/fonts\/ ではありません/
  )
})

test('HTML の Google Fonts link を同一オリジンの preload とスタイルシートへ置き換えること', () => {
  // Given: href の & は実体参照。アプリ CSS と無関係な preconnect は残す
  const html = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://api.example.com">',
    `<link rel="stylesheet" href="${STYLESHEET_HREF}" crossorigin>`,
    '<link href="/static/css/index.cccccccccc.css" rel="stylesheet">',
    '<link rel="manifest" href="/manifest.webmanifest">',
  ].join('')
  const stylesheetHref = '/static/css/fonts.ffffffffff.css'

  // When
  const next = replaceGoogleFontsHtmlLinks(html, stylesheetHref)

  // Then
  assert.equal(extractGoogleFontsStylesheetUrl(html), STYLESHEET_HREF.replaceAll('&amp;', '&'))
  assert.equal(next.includes('fonts.googleapis.com'), false)
  assert.equal(next.includes('fonts.gstatic.com'), false)
  assert.equal(next.includes('https://api.example.com'), true)
  assert.equal(next.includes('/static/css/index.cccccccccc.css'), true)
  assert.equal(next.includes('/manifest.webmanifest'), true)
  assert.equal(
    next.includes(
      `<link rel="preload" href="${stylesheetHref}" as="style"><link rel="stylesheet" href="${stylesheetHref}">`
    ),
    true
  )
})

test('クエリ付きの woff2 URL は拒否すること', () => {
  // Given: 拡張子は woff2 だがクエリが付いた URL。
  const css = FONT_CSS.replace(OSWALD, `${OSWALD}?v=123`)

  // When / Then: クエリだけでも拒否する。
  assert.throws(() => collectGoogleFontFileUrls(css), /woff2 ではありません/)
})

test('単一ウェイトの font-weight は拒否すること', () => {
  // Given: 可変範囲ではなく単一ウェイトの @font-face。
  const css = FONT_CSS.replace('font-weight: 100 900;', 'font-weight: 400;')

  // When / Then: ウェイトの記述があれば範囲外として拒否する。
  assert.throws(() => collectGoogleFontFileUrls(css), /可変ウェイトではありません/)
})

test('Google Fonts のスタイルシートが無い、または置換後も URL が残る場合は失敗すること', () => {
  // Given
  const withoutStylesheet = '<link rel="stylesheet" href="/static/css/index.css">'
  const withLeftover =
    '<script>const origin = "https://fonts.googleapis.com"</script>' +
    `<link rel="stylesheet" href="${STYLESHEET_HREF}">`

  // When / Then
  assert.throws(
    () => extractGoogleFontsStylesheetUrl(withoutStylesheet),
    /スタイルシート link が1つではありません/
  )
  assert.throws(
    () => replaceGoogleFontsHtmlLinks(withLeftover, '/static/css/fonts.ffffffffff.css'),
    /Google Fonts の URL が残っています/
  )
  assert.throws(
    () =>
      replaceGoogleFontsHtmlLinks(
        `<link rel="stylesheet" href="${STYLESHEET_HREF}">`,
        '/fonts.css'
      ),
    /フォント CSS のパスが不正です/
  )
})
