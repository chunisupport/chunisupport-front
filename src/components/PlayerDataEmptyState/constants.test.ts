import assert from 'node:assert/strict'
import test from 'node:test'

test('未登録案内の外部 URL が環境変数から生成されること', async () => {
  // Given: ブックマークレット配布サイトを含む必須環境変数が設定されている
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://help.example.com'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.example.com'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'pek.js'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = 'test-turnstile-site-key'

  // When: 未登録案内の外部 URL 定数を読み込む
  const { CHUNISUPPORT_BOOKMARKLET, DATA_REGISTRATION_HELP_URL } = await import('./constants.ts')

  // Then: 配布サイトとドキュメントサイトの環境別 URL が設定される
  assert.match(CHUNISUPPORT_BOOKMARKLET, /e\.src="https:\/\/dist\.example\.com\/pek\.js"/)
  assert.equal(DATA_REGISTRATION_HELP_URL, 'https://help.example.com/help/data-registration/')
})
