import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  accentPreference,
  themePreference,
  updateAccentPreference,
  updateThemePreference,
} from '../../stores/themePreferences'
import type { AccentPreference, ThemePreference } from '../../utils/themePreference'
import {
  ACCENT_OPTIONS,
  APPEARANCE_SETTINGS_COPY,
  THEME_OPTIONS,
} from './AppearanceSettings.constants'

/** 外観設定 Select のトリガーに適用するクラス。 */
const SELECT_TRIGGER_CLASS =
  'flex min-h-11 w-full items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-3 text-left text-sm font-semibold text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/** 外観設定 Select の選択肢ポータルに適用するクラス。 */
const SELECT_CONTENT_CLASS =
  'z-60 w-[--kb-select-content-width] overflow-hidden rounded-lg border border-border bg-surface shadow-md'

/** 外観設定 Select の選択肢に適用するクラス。 */
const SELECT_ITEM_CLASS =
  'flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text outline-none hover:bg-action-primary-muted data-[highlighted]:bg-action-primary-muted data-[selected]:bg-action-primary-muted'

/**
 * 背景テーマとアクセントカラーを独立して選択するUIを表示する。
 * @returns 外観設定のJSX要素
 */
const AppearanceSettings = (): JSX.Element => {
  /**
   * Selectの選択値を背景テーマとして適用する。
   * @param value 選択された背景テーマ
   * @returns なし
   */
  const handleThemeChange = (value: string | null): void => {
    if (value !== null && THEME_OPTIONS.some((option) => option.value === value)) {
      updateThemePreference(value as ThemePreference)
    }
  }

  /**
   * Selectの選択値をアクセントカラーとして適用する。
   * @param value 選択されたアクセントカラー
   * @returns なし
   */
  const handleAccentChange = (value: string | null): void => {
    if (value !== null && ACCENT_OPTIONS.some((option) => option.value === value)) {
      updateAccentPreference(value as AccentPreference)
    }
  }

  return (
    <div class="grid gap-6">
      <Select<ThemePreference>
        options={THEME_OPTIONS.map((option) => option.value)}
        optionTextValue={(value) =>
          THEME_OPTIONS.find((option) => option.value === value)?.label ?? value
        }
        value={themePreference()}
        onChange={handleThemeChange}
        gutter={0}
        itemComponent={(itemProps) => (
          <Select.Item item={itemProps.item} class={SELECT_ITEM_CLASS}>
            <Select.ItemLabel>
              {THEME_OPTIONS.find((option) => option.value === itemProps.item.rawValue)?.label}
            </Select.ItemLabel>
            <Select.ItemIndicator class="text-action-primary">
              <Check size={16} />
            </Select.ItemIndicator>
          </Select.Item>
        )}
      >
        <Select.Label class="text-sm font-semibold text-text">
          {APPEARANCE_SETTINGS_COPY.themeLabel}
        </Select.Label>
        <Select.Trigger class={SELECT_TRIGGER_CLASS}>
          <Select.Value<ThemePreference>>
            {(state) =>
              THEME_OPTIONS.find((option) => option.value === state.selectedOption())?.label
            }
          </Select.Value>
          <Select.Icon class="text-text-subtle">
            <ChevronsUpDown size={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class={SELECT_CONTENT_CLASS}>
            <Select.Listbox />
          </Select.Content>
        </Select.Portal>
      </Select>

      <Select<AccentPreference>
        options={ACCENT_OPTIONS.map((option) => option.value)}
        optionTextValue={(value) =>
          ACCENT_OPTIONS.find((option) => option.value === value)?.label ?? value
        }
        value={accentPreference()}
        onChange={handleAccentChange}
        gutter={0}
        itemComponent={(itemProps) => {
          const option = ACCENT_OPTIONS.find(
            (candidate) => candidate.value === itemProps.item.rawValue
          )

          return (
            <Select.Item item={itemProps.item} class={SELECT_ITEM_CLASS}>
              <div class="flex items-center gap-3">
                <span
                  class={`h-5 w-5 shrink-0 rounded-full border border-border-strong ${option?.swatchClass ?? ''}`}
                  aria-hidden="true"
                />
                <Select.ItemLabel>{option?.label}</Select.ItemLabel>
              </div>
              <Select.ItemIndicator class="text-action-primary">
                <Check size={16} />
              </Select.ItemIndicator>
            </Select.Item>
          )
        }}
      >
        <Select.Label class="text-sm font-semibold text-text">
          {APPEARANCE_SETTINGS_COPY.accentLabel}
        </Select.Label>
        <Select.Trigger class={SELECT_TRIGGER_CLASS}>
          <Select.Value<AccentPreference>>
            {(state) => {
              const option = ACCENT_OPTIONS.find(
                (candidate) => candidate.value === state.selectedOption()
              )

              return (
                <span class="flex items-center gap-3">
                  <span
                    class={`h-5 w-5 shrink-0 rounded-full border border-border-strong ${option?.swatchClass ?? ''}`}
                    aria-hidden="true"
                  />
                  {option?.label}
                </span>
              )
            }}
          </Select.Value>
          <Select.Icon class="text-text-subtle">
            <ChevronsUpDown size={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class={SELECT_CONTENT_CLASS}>
            <Select.Listbox />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  )
}

export default AppearanceSettings
