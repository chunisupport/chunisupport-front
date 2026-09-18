import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {
  createStaticPageHtml,
  resolvePublicUrl,
  resolveStaticPageOutputPath,
} from './staticPageHtml'

const TEMPLATE = `<!doctype html>
<html>
  <head>
    <title>ChuniSupport</title>
    <meta name="robots" content="noindex">
  </head>
  <body><script src="/static/app.js"></script></body>
</html>`

test('トップページ用メタ情報を追加し、既存タグを維持すること', () => {
  // Given
  const metadata = {
    title: 'ChuniSupport | CHUNITHMスコアツール',
    description: 'CHUNITHMプレイヤーのためのスコア管理ツール',
    canonicalUrl: 'https://chunisupport.net/',
    imageUrl: 'https://chunisupport.net/ogp.png',
  }

  // When
  const html = createStaticPageHtml(TEMPLATE, metadata)

  // Then
  assert.match(html, /<title>ChuniSupport \| CHUNITHMスコアツール<\/title>/)
  assert.match(
    html,
    /<meta name="description" content="CHUNITHMプレイヤーのためのスコア管理ツール">/
  )
  assert.match(html, /<meta property="og:image" content="https:\/\/chunisupport\.net\/ogp\.png">/)
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/)
  assert.match(html, /<meta name="robots" content="noindex">/)
  assert.match(html, /<script src="\/static\/app\.js"><\/script>/)
})

test('メタ情報へ埋め込む特殊文字をエスケープすること', () => {
  // Given
  const metadata = {
    title: `A & B <C> "D" 'E'`,
    description: `説明 & <危険> "引用" '引用'`,
    canonicalUrl: 'https://example.com/?a=1&b=2',
    imageUrl: 'https://example.com/ogp.png?a=1&b=2',
  }

  // When
  const html = createStaticPageHtml(TEMPLATE, metadata)

  // Then
  assert.match(html, /A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;/)
  assert.match(html, /説明 &amp; &lt;危険&gt; &quot;引用&quot; &#39;引用&#39;/)
  assert.match(html, /\?a=1&amp;b=2/)
})

test('title 要素がない HTML を拒否すること', () => {
  // Given
  const templateWithoutTitle = TEMPLATE.replace('<title>ChuniSupport</title>', '')

  // When & Then
  assert.throws(
    () =>
      createStaticPageHtml(templateWithoutTitle, {
        title: 'Title',
        description: 'Description',
        canonicalUrl: 'https://example.com/',
        imageUrl: 'https://example.com/ogp.png',
      }),
    new Error('HTML 内の title 要素を一意に特定できません。')
  )
})

test('公開 URL をベース URL 末尾のスラッシュに依存せず解決すること', () => {
  // Given
  const baseUrl = 'https://chunisupport.net'

  // When
  const rootUrl = resolvePublicUrl('/', baseUrl)
  const imageUrl = resolvePublicUrl('/ogp.png', baseUrl)

  // Then
  assert.equal(rootUrl, 'https://chunisupport.net/')
  assert.equal(imageUrl, 'https://chunisupport.net/ogp.png')
})

test('HTTP(S) 以外の公開 URL を拒否すること', () => {
  // Given
  const baseUrl = 'file:///tmp/site/'

  // When & Then
  assert.throws(
    () => resolvePublicUrl('/', baseUrl),
    new Error('PUBLIC_FRONTEND_URL は HTTP(S) の絶対 URL で指定してください。')
  )
})

test('固定ページのパスを対応する HTML 出力先へ変換すること', () => {
  // Given
  const distDirectory = path.resolve('app', 'dist')

  // When & Then
  assert.equal(
    resolveStaticPageOutputPath(distDirectory, '/'),
    path.join(distDirectory, 'root-ogp.html')
  )
  assert.equal(
    resolveStaticPageOutputPath(distDirectory, '/tools'),
    path.join(distDirectory, 'tools.html')
  )
  assert.equal(
    resolveStaticPageOutputPath(distDirectory, '/tools/dashboard'),
    path.join(distDirectory, 'tools', 'dashboard.html')
  )
})

test('固定ページとして扱えないパスを拒否すること', () => {
  // Given
  const invalidPaths = ['/tools/', '/tools?tab=all', '/tools#heading', '/tools/../admin']

  // When & Then
  for (const invalidPath of invalidPaths) {
    assert.throws(
      () => resolveStaticPageOutputPath(path.resolve('app', 'dist'), invalidPath),
      new Error(`固定ページのパスが不正です: ${invalidPath}`)
    )
  }
})
