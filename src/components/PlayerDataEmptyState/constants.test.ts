import assert from 'node:assert/strict'
import test from 'node:test'

test('ブックマークレット配布サイトの環境変数からスクリプト URL が生成されること', async () => {
  // Given: ブックマークレット配布サイトを含む必須環境変数が設定されている
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://help.example.com'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.example.com'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = 'test-turnstile-site-key'

  // When: ブックマークレット定数を読み込む
  const { CHUNISUPPORT_BOOKMARKLET } = await import('./constants')

  // Then: 配布サイト上の main.js が読み込み先として設定される
  assert.match(CHUNISUPPORT_BOOKMARKLET, /e\.src="https:\/\/dist\.example\.com\/main\.js"/)
})
