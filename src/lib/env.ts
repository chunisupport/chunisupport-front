const ENV_KEYS = [
  'PUBLIC_BACKEND_URL',
  'PUBLIC_FRONTEND_URL',
  'PUBLIC_DOCUMENTATION_URL',
  'PUBLIC_BOOKMARKLET_URL',
  'PUBLIC_BOOKMARKLET_ENTRYPOINT',
  'PUBLIC_FB_API_KEY',
  'PUBLIC_FB_AUTH_DOMAIN',
  'PUBLIC_FB_PROJECT_ID',
  'PUBLIC_FB_STORAGE_BUCKET',
  'PUBLIC_FB_MESSAGING_SENDER_ID',
  'PUBLIC_FB_APP_ID',
  'PUBLIC_FB_MEASUREMENT_ID',
  'PUBLIC_CF_TURNSTILE_SITE_KEY',
] as const

type EnvKey = (typeof ENV_KEYS)[number]
export type AppEnv = Record<EnvKey, string | undefined>

const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env

/**
 * 指定された公開環境変数をビルド時またはテスト実行時の環境から取得する。
 * @param key 取得する公開環境変数のキー
 * @returns 環境変数の値。未設定の場合は undefined
 */
const readEnvValue = (key: EnvKey): string | undefined => {
  return importMetaEnv?.[key] ?? (typeof process !== 'undefined' ? process.env[key] : undefined)
}

/**
 * アプリケーションで利用可能な公開環境変数を取得する。
 * @returns 公開環境変数と値の対応
 */
export const getEnv = (): AppEnv => {
  const env = {} as AppEnv
  for (const key of ENV_KEYS) {
    env[key] = readEnvValue(key)
  }
  return env
}

/**
 * 必須の公開環境変数を取得する。
 * @param key 取得する公開環境変数のキー
 * @returns 設定済みの環境変数の値
 * @throws 環境変数が未設定の場合
 */
export const getRequiredEnv = (key: EnvKey): string => {
  const value = readEnvValue(key)
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません。.envファイルを確認してください。`)
  }
  return value
}
