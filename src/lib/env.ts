const ENV_KEYS = [
  'PUBLIC_BACKEND_URL',
  'PUBLIC_FB_API_KEY',
  'PUBLIC_FB_AUTH_DOMAIN',
  'PUBLIC_FB_PROJECT_ID',
  'PUBLIC_FB_STORAGE_BUCKET',
  'PUBLIC_FB_MESSAGING_SENDER_ID',
  'PUBLIC_FB_APP_ID',
  'PUBLIC_FB_MEASUREMENT_ID',
] as const

type EnvKey = (typeof ENV_KEYS)[number]
export type AppEnv = Record<EnvKey, string | undefined>

const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env

const readEnvValue = (key: EnvKey): string | undefined => {
  return importMetaEnv?.[key] ?? (typeof process !== "undefined" ? process.env[key] : undefined)
}

export const getEnv = (): AppEnv => {
  return {
    PUBLIC_BACKEND_URL: readEnvValue('PUBLIC_BACKEND_URL'),
    PUBLIC_FB_API_KEY: readEnvValue('PUBLIC_FB_API_KEY'),
    PUBLIC_FB_AUTH_DOMAIN: readEnvValue('PUBLIC_FB_AUTH_DOMAIN'),
    PUBLIC_FB_PROJECT_ID: readEnvValue('PUBLIC_FB_PROJECT_ID'),
    PUBLIC_FB_STORAGE_BUCKET: readEnvValue('PUBLIC_FB_STORAGE_BUCKET'),
    PUBLIC_FB_MESSAGING_SENDER_ID: readEnvValue('PUBLIC_FB_MESSAGING_SENDER_ID'),
    PUBLIC_FB_APP_ID: readEnvValue('PUBLIC_FB_APP_ID'),
    PUBLIC_FB_MEASUREMENT_ID: readEnvValue('PUBLIC_FB_MEASUREMENT_ID'),
  }
}

export const getRequiredEnv = (key: EnvKey): string => {
  const value = readEnvValue(key)
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません。.envファイルを確認してください。`)
  }
  return value
}
