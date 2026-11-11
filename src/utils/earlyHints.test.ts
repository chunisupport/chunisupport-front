import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLOUDFLARE_PAGES_HEADER_LINE_LIMIT,
  CLOUDFLARE_PAGES_HEADER_RULE_LIMIT,
  collectInitialStaticAssetLinkValues,
  collectNonHtmlHeaderPaths,
  countCloudflareHeaderRules,
  createApiPreconnectLinkValue,
  createEarlyHintsHeaderRules,
} from './earlyHints'

const INDEX_HTML = `<!doctype html>
<html><head>
  <!-- <script src="/static/js/commented.js"></script> -->
  <script data-rsbuild-assets-retry="inline">console.log("/static/js/inline.js")</script>
  <script defer src="/static/js/1482.aaaaaaaaaa.js"></script>
  <script defer src='/static/js/index.bbbbbbbbbb.js'></script>
  <script defer src="/static/js/index.bbbbbbbbbb.js"></script>
  <link rel="icon" href="/favicon.hash.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost" crossorigin>
  <link href="/static/css/index.cccccccccc.css" rel="stylesheet">
  <link rel="preload" href="/static/css/fonts.dddddddddd.css" as="style">
  <link rel="stylesheet" href="/static/css/fonts.dddddddddd.css">
  <script src="https://static.cloudflareinsights.com/beacon.min.js"></script>
</head></html>`

test('初期HTMLの /static/ CSS と JS だけを preload の Link にすること', () => {
  // Given: JS が先、CSS が後。外部フォント・アイコン・外部スクリプト・コメント内の参照を含む。
  // フォント CSS の preload タグは stylesheet と重複させない
  const html = INDEX_HTML

  // When
  const linkValues = collectInitialStaticAssetLinkValues(html)

  // Then: レンダリングをブロックする CSS を先にし、スクリプトは出現順。重複は1つ
  assert.deepEqual(linkValues, [
    '</static/css/index.cccccccccc.css>; rel=preload; as=style',
    '</static/css/fonts.dddddddddd.css>; rel=preload; as=style',
    '</static/js/1482.aaaaaaaaaa.js>; rel=preload; as=script',
    '</static/js/index.bbbbbbbbbb.js>; rel=preload; as=script',
  ])
})

test('実タグの crossorigin を preload に引き継ぐこと', () => {
  // Given
  const html = `<link rel="stylesheet" href="/static/css/index.aaa.css" crossorigin="anonymous">
    <script src="/static/js/index.bbb.js" crossorigin></script>
    <script src="/static/js/vendor.ccc.js" crossorigin="use-credentials"></script>`

  // When
  const linkValues = collectInitialStaticAssetLinkValues(html)

  // Then
  assert.deepEqual(linkValues, [
    '</static/css/index.aaa.css>; rel=preload; as=style; crossorigin',
    '</static/js/index.bbb.js>; rel=preload; as=script; crossorigin',
    '</static/js/vendor.ccc.js>; rel=preload; as=script; crossorigin=use-credentials',
  ])
})

test('初期アセットのパスが /static/ の CSS または JS でない場合は失敗すること', () => {
  // Given
  const html = '<script src="/static/../secret.js"></script>'

  // When / Then
  assert.throws(
    () => collectInitialStaticAssetLinkValues(html),
    /初期アセットのパスが \/static\/ 配下ではありません/
  )
})

test('APIの preconnect はオリジンだけで、未設定時は作らないこと', () => {
  // Given: パス付きの本番 API URL と、未設定
  const backendUrl = 'https://api.chunisupport.net/internal/songs'

  // When
  const linkValue = createApiPreconnectLinkValue(backendUrl)

  // Then: Cookie を送らない CORS anonymous なので crossorigin を付ける
  assert.equal(linkValue, '<https://api.chunisupport.net>; rel=preconnect; crossorigin')
  assert.equal(createApiPreconnectLinkValue(undefined), undefined)
  assert.equal(createApiPreconnectLinkValue('   '), undefined)
})

test('PUBLIC_BACKEND_URL が URL でない場合は失敗すること', () => {
  // Given
  const backendUrl = 'api.chunisupport.net'

  // When / Then
  assert.throws(
    () => createApiPreconnectLinkValue(backendUrl),
    /PUBLIC_BACKEND_URL が URL として不正です/
  )
})

test('非HTMLの既存パターンと dist の静的ファイルを Link の除外パスにすること', () => {
  // Given
  const relativePaths = [
    'index.html',
    'tools/dashboard.html',
    'version.json',
    'favicon.abc.png',
    'ogp.png',
    'manifest.webmanifest',
    'static/js/index.abc.js',
    '_headers',
    '_redirects',
    'apple-touch-icon.png',
  ]

  // When
  const headerPaths = collectNonHtmlHeaderPaths(relativePaths)

  // Then: /static/* と favicon パターンに含まれるファイルは個別に足さない
  assert.deepEqual(headerPaths, [
    '/static/*',
    '/version.json',
    '/favicon.*.png',
    '/apple-touch-icon.png',
    '/manifest.webmanifest',
    '/ogp.png',
  ])
})

test('Early Hints の規則は HTML へ複数の Link を書き、非HTMLでは Link だけを外すこと', () => {
  // Given
  const nonHtmlPaths = ['/static/*', '/version.json', '/favicon.*.png', '/ogp.png']

  // When
  const rules = createEarlyHintsHeaderRules({
    html: INDEX_HTML,
    backendUrl: 'https://api.chunisupport.net',
    nonHtmlPaths,
  })
  const lines = rules.split('\n')
  const rulePaths = lines.filter(
    (line) => line !== '' && !line.startsWith('#') && !line.startsWith(' ')
  )

  // Then
  assert.deepEqual(rulePaths, ['/*', '/static/*', '/version.json', '/favicon.*.png', '/ogp.png'])
  assert.deepEqual(
    lines.filter((line) => line.startsWith('  Link:')),
    [
      '  Link: </static/css/index.cccccccccc.css>; rel=preload; as=style',
      '  Link: </static/css/fonts.dddddddddd.css>; rel=preload; as=style',
      '  Link: </static/js/1482.aaaaaaaaaa.js>; rel=preload; as=script',
      '  Link: </static/js/index.bbbbbbbbbb.js>; rel=preload; as=script',
      '  Link: <https://api.chunisupport.net>; rel=preconnect; crossorigin',
    ]
  )
  const headerLines = lines.filter((line) => line.startsWith('  '))
  assert.equal(lines.filter((line) => line === '  ! Link').length, nonHtmlPaths.length)
  assert.equal(
    headerLines.some((line) => line.includes('Cache-Control')),
    false
  )
  assert.equal(
    headerLines.some((line) => line.includes('Content-Security-Policy')),
    false
  )
  assert.equal(rules.includes('fonts.googleapis.com'), false)
  assert.ok(lines.every((line) => line.length <= CLOUDFLARE_PAGES_HEADER_LINE_LIMIT))
  assert.ok(countCloudflareHeaderRules(rules) < CLOUDFLARE_PAGES_HEADER_RULE_LIMIT)
})

test('PUBLIC_BACKEND_URL が未設定のときは preconnect を付けないこと', () => {
  // Given / When
  const rules = createEarlyHintsHeaderRules({
    html: INDEX_HTML,
    backendUrl: undefined,
    nonHtmlPaths: ['/static/*'],
  })

  // Then
  assert.equal(rules.includes('rel=preconnect'), false)
  assert.equal(rules.includes('rel=preload'), true)
})

test('_headers の規則数はパス行だけを数えること', () => {
  // Given
  const headersFile = `# comment
/static/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
`

  // When
  const count = countCloudflareHeaderRules(headersFile)

  // Then
  assert.equal(count, 2)
})
