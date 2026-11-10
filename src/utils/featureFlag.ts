import {
  APP_ENVIRONMENTS,
  type AppEnvironment,
  type FeatureFlagDefinition,
} from '../constants/featureFlags'

/**
 * 文字列が feature-flag の運用環境名かを判定する。
 * @param value - 検証する環境名。未設定の場合は undefined。
 * @returns develop / staging / production のいずれかに完全一致する場合は true。
 */
export const isAppEnvironment = (value: string | undefined): value is AppEnvironment =>
  APP_ENVIRONMENTS.some((environment) => environment === value)

/**
 * 定義と環境から、有効な機能名の集合を作る。
 * @typeParam Name - 定義に登録されている機能名。
 * @param definitions - 機能ごとの環境別有効・無効の定義。
 * @param environment - 判定対象の運用環境。
 * @returns 指定環境で明示的に true の機能名だけを含む集合。
 */
export const resolveEnabledFeatures = <Name extends string>(
  definitions: Readonly<Record<Name, FeatureFlagDefinition>>,
  environment: AppEnvironment
): ReadonlySet<Name> => {
  const enabledFeatures = new Set<Name>()
  for (const name in definitions) {
    if (definitions[name][environment] === true) {
      enabledFeatures.add(name)
    }
  }
  return enabledFeatures
}
