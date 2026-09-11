const TEST_ENVIRONMENT = {
  PUBLIC_BACKEND_URL: 'http://localhost:3000',
  PUBLIC_FRONTEND_URL: 'http://localhost:3000',
  PUBLIC_DOCUMENTATION_URL: 'https://docs.chunisupport.net',
  PUBLIC_BOOKMARKLET_URL: 'https://dist.chunisupport.net',
  PUBLIC_BOOKMARKLET_ENTRYPOINT: 'main.js',
  PUBLIC_CHUNITHM_JACKET_BASE_URL: 'https://example.com/jackets',
  PUBLIC_FB_API_KEY: 'test-api-key',
  PUBLIC_FB_AUTH_DOMAIN: 'test.firebaseapp.com',
  PUBLIC_FB_PROJECT_ID: 'test-project',
  PUBLIC_FB_STORAGE_BUCKET: 'test.appspot.com',
  PUBLIC_FB_MESSAGING_SENDER_ID: '123456789',
  PUBLIC_FB_APP_ID: 'test-app-id',
  PUBLIC_CF_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
} as const

/**
 * API・queryモジュールの読み込みに必要な公開環境変数を設定する。
 * @param overrides テスト固有の上書き値。
 * @returns なし。
 */
export const setupTestEnvironment = (overrides: Record<string, string> = {}): void => {
  Object.assign(process.env, TEST_ENVIRONMENT, overrides)
}

/**
 * 動的importのモジュールキャッシュをテストごとに分離するキーを生成する。
 * @returns 一意なキャッシュキー。
 */
export const createTestCacheKey = (): string => `${Date.now()}-${Math.random()}`

export type RecordedFetchCall = {
  input: Parameters<typeof fetch>[0]
  init: Parameters<typeof fetch>[1]
}

/**
 * fetchを応答関数へ差し替え、呼び出し内容を記録する。
 * @param respond テスト対象へ返す応答を生成する関数。
 * @returns 記録されたfetch呼び出しの配列。
 */
export const installFetchRecorder = (
  respond: (...args: Parameters<typeof fetch>) => Response | Promise<Response>
): RecordedFetchCall[] => {
  const calls: RecordedFetchCall[] = []
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init })
    return respond(input, init)
  }
  return calls
}
