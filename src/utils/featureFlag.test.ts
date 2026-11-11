import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APP_ENVIRONMENTS,
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlagDefinition,
} from '../constants/featureFlags'
import { isAppEnvironment, resolveEnabledFeatures } from './featureFlag'

/** 環境ごとの有効化と、省略・false による無効化を検証するための定義。 */
const TEST_DEFINITIONS = {
  develop_only: { develop: true },
  preview: { develop: true, staging: true, production: false },
  released: { develop: true, staging: true, production: true },
  disabled: { develop: false, staging: false, production: false },
  omitted: {},
} as const satisfies Record<string, FeatureFlagDefinition>

for (const environment of APP_ENVIRONMENTS) {
  test(`${environment} で true の機能だけが集合に入る`, () => {
    // Given: 環境ごとの true / false と省略を含む定義。
    const expected = {
      develop: ['develop_only', 'preview', 'released'],
      staging: ['preview', 'released'],
      production: ['released'],
    }

    // When: 対象環境で有効な機能を解決する。
    const enabledFeatures = resolveEnabledFeatures(TEST_DEFINITIONS, environment)

    // Then: false または省略された機能を含まず、true の機能だけになる。
    assert.deepEqual(enabledFeatures, new Set(expected[environment]))
  })

  test(`${environment} で定義が0件なら空集合になる`, () => {
    // Given: 登録フラグが0件の定義。
    const definitions = {}

    // When: 対象環境で有効な機能を解決する。
    const enabledFeatures = resolveEnabledFeatures(definitions, environment)

    // Then: 有効な機能はない。
    assert.deepEqual(enabledFeatures, new Set())
  })
}

test('profile_comment は develop と staging で有効、production では無効', () => {
  // Given: 登録済みのプロフィールコメントフラグ。production は false。
  const definition = FEATURE_FLAG_DEFINITIONS.profile_comment

  // When: 各運用環境で有効な機能を解決する。
  const develop = resolveEnabledFeatures(FEATURE_FLAG_DEFINITIONS, 'develop')
  const staging = resolveEnabledFeatures(FEATURE_FLAG_DEFINITIONS, 'staging')
  const production = resolveEnabledFeatures(FEATURE_FLAG_DEFINITIONS, 'production')

  // Then: dev / stg だけ有効で、本番の集合には入らない。
  assert.equal(definition.develop, true)
  assert.equal(definition.staging, true)
  assert.equal(definition.production, false)
  assert.equal(develop.has('profile_comment'), true)
  assert.equal(staging.has('profile_comment'), true)
  assert.equal(production.has('profile_comment'), false)
})

test('isAppEnvironment は3種類の運用環境名を受け付ける', () => {
  // Given: 運用で利用する3種類の環境名。
  const values = ['develop', 'staging', 'production']

  // When / Then: いずれも正規の環境として扱う。
  for (const value of values) {
    assert.equal(isAppEnvironment(value), true)
  }
})

test('isAppEnvironment は未設定・大文字違い・空文字・未知の環境名を拒否する', () => {
  // Given: 許可されていない環境名。
  const values = [undefined, 'Develop', 'STAGING', 'Production', '', 'test', ' develop ']

  // When / Then: 正規化せず、完全一致しない値を拒否する。
  for (const value of values) {
    assert.equal(isAppEnvironment(value), false)
  }
})

/**
 * 登録名・環境キー・値の制約をコンパイル時に検証する。実行時には呼び出さない。
 * @returns 戻り値なし。
 */
const verifyFeatureFlagTypes = (): void => {
  // Given: テスト用定義から推論された機能名の集合。
  const enabledFeatures = resolveEnabledFeatures(TEST_DEFINITIONS, 'develop')

  // When / Then: 未登録名は参照できない。
  // @ts-expect-error テスト用定義に存在しない名前は指定できない。
  enabledFeatures.has('unregistered')

  // Given / When / Then: オブジェクトリテラルの未知の環境キーは型エラーになる。
  const invalidEnvironment = {
    // @ts-expect-error 許可されていない環境キー。
    example: { preview: true },
  } satisfies Record<string, FeatureFlagDefinition>
  void invalidEnvironment

  // Given / When / Then: オブジェクトリテラルの非 boolean 値は型エラーになる。
  const invalidValue = {
    // @ts-expect-error 環境ごとの値は boolean のみ。
    example: { develop: 'true' },
  } satisfies Record<string, FeatureFlagDefinition>
  void invalidValue
}

// 型検証用の関数は参照だけ行い、不正入力を実行時には評価しない。
void verifyFeatureFlagTypes
