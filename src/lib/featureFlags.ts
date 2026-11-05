import {
  type AppEnvironment,
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlagName,
  INVALID_APP_ENVIRONMENT_MESSAGE,
} from '../constants/featureFlags'
import { isAppEnvironment, resolveEnabledFeatures } from '../utils/featureFlag'
import { getRequiredEnv } from './env'

const environment = getRequiredEnv('PUBLIC_APP_ENV')
if (!isAppEnvironment(environment)) {
  throw new Error(INVALID_APP_ENVIRONMENT_MESSAGE)
}

/** 現在のビルドの運用環境。モジュール読み込み時に必須設定と値を検証する。 */
export const APP_ENVIRONMENT: AppEnvironment = environment

/** 現在のビルドで有効な機能名。環境は実行中に変わらないため一度だけ解決する。 */
const enabledFeatures = resolveEnabledFeatures(FEATURE_FLAG_DEFINITIONS, APP_ENVIRONMENT)

/**
 * 現在の環境で機能が有効かを返す。画面側からのみ利用する。
 * @param name - 定義に登録されている機能名。
 * @returns 現在のビルドの運用環境で有効な場合は true。
 */
export const isFeatureEnabled = (name: FeatureFlagName): boolean => enabledFeatures.has(name)
