import { AUTH_PROVIDERS } from '../constants/authProviders'
import { selectVisibleAuthProviders } from '../usecases/auth/authProviders'
import { isFeatureEnabled } from './featureFlags'

/**
 * 現在の環境でログイン・新規登録・ログイン方法の設定に表示する認証プロバイダ。
 * 各定義の feature-flag（X は `x_login`）が有効な環境でだけ含める。画面側からのみ利用する。
 */
export const VISIBLE_AUTH_PROVIDERS = selectVisibleAuthProviders(AUTH_PROVIDERS, isFeatureEnabled)
