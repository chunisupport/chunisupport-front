/** feature-flag を切り替える運用環境。 */
export const APP_ENVIRONMENTS = ['develop', 'staging', 'production'] as const

/** feature-flag の判定に使用できる運用環境名。 */
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

/** 環境ごとの有効・無効の定義。省略した環境は無効。 */
export type FeatureFlagDefinition = Readonly<Partial<Record<AppEnvironment, boolean>>>

/** 運用環境名が不正な場合のエラーメッセージ。 */
export const INVALID_APP_ENVIRONMENT_MESSAGE = `PUBLIC_APP_ENV は ${APP_ENVIRONMENTS.join(' / ')} のいずれかを指定してください。`

/**
 * 機能ごとの環境別有効・無効の定義。
 * API 側と同じ機能を制御する場合は、feature-flag.yml と同じ snake_case 名を使う。
 */
export const FEATURE_FLAG_DEFINITIONS = {
  /** 管理画面から配備設定を確認するための機能。API と同名。確認が済んだら削除する。 */
  feature_flag_probe: { develop: true, staging: true, production: false },
} as const satisfies Record<string, FeatureFlagDefinition>

/** 登録済みの機能名。定義が0件の場合は never。 */
export type FeatureFlagName = keyof typeof FEATURE_FLAG_DEFINITIONS
