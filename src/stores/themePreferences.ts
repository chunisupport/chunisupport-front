import { createSignal } from 'solid-js'
import {
  type AccentPreference,
  applyAccentPreference,
  applyThemePreference,
  readAccentPreference,
  readThemePreference,
  saveAccentPreference,
  saveThemePreference,
  type ThemePreference,
} from '../utils/themePreference'

export const [themePreference, setThemePreferenceSignal] = createSignal<ThemePreference>(
  readThemePreference()
)
export const [accentPreference, setAccentPreferenceSignal] = createSignal<AccentPreference>(
  readAccentPreference()
)

/**
 * 背景テーマを共有状態、永続ストレージ、ルート要素へ反映する。
 * @param preference 適用する背景テーマ
 * @returns なし
 */
export const updateThemePreference = (preference: ThemePreference): void => {
  saveThemePreference(preference)
  applyThemePreference(preference)
  setThemePreferenceSignal(preference)
}

/**
 * アクセントカラーを共有状態、永続ストレージ、ルート要素へ反映する。
 * @param preference 適用するアクセントカラー
 * @returns なし
 */
export const updateAccentPreference = (preference: AccentPreference): void => {
  saveAccentPreference(preference)
  applyAccentPreference(preference)
  setAccentPreferenceSignal(preference)
}
