import type { FeatureFlagName } from './featureFlags'

/** ログインに利用できる認証プロバイダの種類 */
export type AuthProviderKind = 'google' | 'x'

/** 認証プロバイダごとの識別子と表示名 */
export type AuthProviderDefinition = {
  /** アプリ内で認証プロバイダを区別する種類 */
  kind: AuthProviderKind
  /** Firebase Authentication の providerId */
  providerId: string
  /** 画面に表示するサービス名 */
  label: string
  /** 画面への表示を切り替える feature-flag。省略時は常に表示する。 */
  featureFlag?: FeatureFlagName
}

/**
 * 認証プロバイダの種類ごとの定義。
 * X は Firebase 上では旧サービス名の `twitter.com` として扱われる。
 */
export const AUTH_PROVIDER_BY_KIND = {
  google: { kind: 'google', providerId: 'google.com', label: 'Google' },
  x: { kind: 'x', providerId: 'twitter.com', label: 'X', featureFlag: 'x_login' },
} as const satisfies Record<AuthProviderKind, AuthProviderDefinition>

/** ログインに利用できる認証プロバイダ。画面にはこの順序で表示する。 */
export const AUTH_PROVIDERS: readonly AuthProviderDefinition[] = [
  AUTH_PROVIDER_BY_KIND.google,
  AUTH_PROVIDER_BY_KIND.x,
]
