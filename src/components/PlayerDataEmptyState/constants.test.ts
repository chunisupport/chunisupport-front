import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

/**
 * 専用子プロセスで環境変数から定数を評価し、親の環境とモジュールキャッシュを隔離する。
 * @returns 子プロセスで生成されたブックマークレットとヘルプURL。
 */
const loadConstantsInChildProcess = (): {
  CHUNISUPPORT_BOOKMARKLET: string
  DATA_REGISTRATION_HELP_URL: string
} => {
  const moduleUrl = new URL('./constants.ts', import.meta.url).href
  const loaderUrl = new URL('../../../scripts/register-ts-extension-loader.mjs', import.meta.url)
    .href
  const output = execFileSync(
    process.execPath,
    [
      '--import',
      loaderUrl,
      '--disable-warning=ExperimentalWarning',
      '--input-type=module',
      '--eval',
      `const constants = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(constants))`,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PUBLIC_BACKEND_URL: 'http://localhost:3000',
        PUBLIC_FRONTEND_URL: 'http://localhost:3000',
        PUBLIC_DOCUMENTATION_URL: 'https://help.example.com',
        PUBLIC_BOOKMARKLET_URL: 'https://dist.example.com',
        PUBLIC_BOOKMARKLET_ENTRYPOINT: 'pek.js',
        PUBLIC_CF_TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
      },
    }
  )
  return JSON.parse(output)
}

test('未登録案内のブックマークレットURLが環境変数から生成されること', () => {
  // Given: 子プロセスに配布サイトとエントリーポイントを設定する。
  // When
  const { CHUNISUPPORT_BOOKMARKLET } = loadConstantsInChildProcess()

  // Then
  assert.match(CHUNISUPPORT_BOOKMARKLET, /e\.src="https:\/\/dist\.example\.com\/pek\.js"/)
})

test('未登録案内のヘルプURLが環境変数から生成されること', () => {
  // Given: 子プロセスにドキュメントサイトを設定する。
  // When
  const { DATA_REGISTRATION_HELP_URL } = loadConstantsInChildProcess()

  // Then
  assert.equal(DATA_REGISTRATION_HELP_URL, 'https://help.example.com/help/data-registration/')
})
