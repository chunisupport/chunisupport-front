import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildReportOnlyContentSecurityPolicy,
  type ContentSecurityPolicyOptions,
  collectInlineScriptHashes,
  createSecurityHeadersRule,
} from './securityHeaders'

const OPTIONS: ContentSecurityPolicyOptions = {
  backendUrl: 'https://api.example.com/v1',
  jacketBaseUrl: 'https://jacket.example.com/jackets/chunithm',
  documentationUrl: 'https://docs.example.com',
  staticDataBaseUrls: ['https://static.example.com', undefined],
  firebaseAuthDomain: 'example.firebaseapp.com',
  inlineScriptHashes: ["'sha256-abc'"],
}

/**
 * CSP 文字列から指定ディレクティブのソース一覧を取り出す。
 *
 * @param policy - CSP ヘッダーの値。
 * @param name - ディレクティブ名。
 * @returns ディレクティブのソース一覧。存在しない場合は undefined。
 */
const getSources = (policy: string, name: string): string[] | undefined =>
  policy
    .split('; ')
    .map((part) => part.split(' '))
    .find(([directiveName]) => directiveName === name)
    ?.slice(1)

test('複数HTMLのインラインscriptのみをsha256ハッシュに変換し、外部scriptと重複は除外すること', () => {
  // Given
  const inline = 'console.log(1)'
  const html = `<script defer src="/static/a.js"></script><script data-x="inline">${inline}</script><script>${inline}</script><script></script>`

  // When
  const hashes = collectInlineScriptHashes([html, `<script>${inline}</script>`])

  // Then
  assert.deepEqual(hashes, ["'sha256-CihokcEcBW4atb/CW/XWsvWwbTjqwQlE9nj9ii5ww5M='"])
})

test('環境ごとのURLはオリジンとして各ディレクティブに含まれること', () => {
  // Given / When
  const policy = buildReportOnlyContentSecurityPolicy(OPTIONS)

  // Then
  const connectSources = getSources(policy, 'connect-src') ?? []
  assert.ok(connectSources.includes('https://api.example.com'))
  assert.ok(connectSources.includes('https://jacket.example.com'))
  assert.ok(connectSources.includes('https://static.example.com'))
  assert.ok(connectSources.includes('https://docs.example.com'))
  assert.ok(!connectSources.includes('undefined'))
  assert.ok(getSources(policy, 'img-src')?.includes('https://jacket.example.com'))
  assert.ok(getSources(policy, 'frame-src')?.includes('https://example.firebaseapp.com'))
  assert.ok(getSources(policy, 'script-src')?.includes("'sha256-abc'"))
})

test('同じオリジンが複数指定されても1つにまとめること', () => {
  // Given
  const options = {
    ...OPTIONS,
    staticDataBaseUrls: ['https://api.example.com/stats', 'https://api.example.com/scores'],
  }

  // When
  const connectSources = getSources(buildReportOnlyContentSecurityPolicy(options), 'connect-src')

  // Then
  assert.equal(connectSources?.filter((source) => source === 'https://api.example.com').length, 1)
})

test('_headers規則は全ページ対象で強制CSPとReport-Only CSPの両方を含むこと', () => {
  // Given / When
  const rule = createSecurityHeadersRule(OPTIONS)
  const lines = rule.trimEnd().split('\n')

  // Then
  assert.equal(lines[0], '/*')
  assert.ok(lines.slice(1).every((line) => line.startsWith('  ')))
  assert.ok(
    lines.includes(
      "  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
    )
  )
  assert.ok(lines.some((line) => line.startsWith('  Content-Security-Policy-Report-Only: ')))
  assert.ok(lines.includes('  X-Content-Type-Options: nosniff'))
})
