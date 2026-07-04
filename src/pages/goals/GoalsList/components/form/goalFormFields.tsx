import { Checkbox } from '@kobalte/core/checkbox'
import { NumberField } from '@kobalte/core/number-field'
import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { Check } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { FormSelect } from '../../../../../components/common/AppSelect'

interface GoalFilterCheckboxProps {
  label: string
  checked: boolean
  /** チェックボックスを操作不可にし、非対象状態として表示するか。 */
  disabled?: boolean
  onChange: (checked: boolean) => void
}

interface GoalTextFieldProps {
  label: string
  ariaLabel?: string
  value: string
  maxLength?: number
  onChange: (value: string) => void
}

interface GoalNumberFieldProps {
  /** 入力欄の表示ラベル。 */
  label: string
  /** 入力欄に表示する数値文字列。 */
  value: string
  /** 入力欄の補足説明。 */
  description?: string
  /** 入力できる最小値。 */
  min?: number
  /** 入力できる最大値。 */
  max?: number
  /** 入力値の増減単位。 */
  step?: number
  /** 入力操作を無効化するか。 */
  disabled?: boolean
  /** 入力値が変更されたときの通知先。 */
  onChange: (value: string) => void
}

export interface GoalSelectOption<TValue extends string> {
  value: TValue
  label: string
}

interface GoalSelectFieldProps<TValue extends string> {
  label: string
  value: TValue
  options: GoalSelectOption<TValue>[]
  onChange: (value: TValue) => void
}

interface GoalTargetModeRadioGroupProps<TValue extends string> {
  /** ラジオグループ全体の表示ラベル。 */
  label: string
  /** フォーム送信・アクセシビリティ用の名前。 */
  name: string
  /** 現在選択中の値。 */
  value: TValue
  /** 選択できる目標値指定方法。 */
  options: GoalSelectOption<TValue>[]
  /** 選択値が変更されたときの通知先。 */
  onChange: (value: TValue) => void
  /** 選択肢カード内へ追加表示する入力欄などの内容。 */
  renderOptionContent?: (option: GoalSelectOption<TValue>) => JSX.Element
}

export const GOAL_FILTER_CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'

/**
 * 入力系コントロールのフォーカス表示を要素内側に収める共通スタイル。
 */
const GOAL_FIELD_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
export const GOAL_FIELD_INPUT_CLASS = `w-full rounded border border-border-strong bg-surface px-3 py-2 text-sm hover:border-input-border-hover ${GOAL_FIELD_FOCUS_CLASS}`
const GOAL_RADIO_CARD_BASE_CLASS =
  'rounded border px-3 py-2 text-sm text-text-muted hover:bg-surface-muted'
const GOAL_RADIO_CARD_UNCHECKED_CLASS = 'border-border-strong bg-surface'
const GOAL_RADIO_CARD_CHECKED_CLASS = 'border-action-primary bg-action-primary-muted'
const GOAL_RADIO_ITEM_CLASS = 'relative flex min-h-6 items-center gap-3'
const GOAL_RADIO_CONTROL_CLASS =
  'pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-input-bg data-[checked]:border-action-primary'

/**
 * 目標設定ダイアログで使う文字列入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、最大文字数、変更ハンドラ。
 * @returns Kobalte TextField を使った入力欄。
 */
export const GoalTextField: Component<GoalTextFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <Show when={props.label}>
      <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
    </Show>
    <TextField.Input
      class={`${GOAL_FIELD_INPUT_CLASS} font-sans`}
      aria-label={props.ariaLabel}
      maxLength={props.maxLength}
    />
    <Show when={props.maxLength}>
      {(maxLength) => (
        <TextField.Description class="mt-1 text-xs text-text-subtle">
          {maxLength()}文字以内
        </TextField.Description>
      )}
    </Show>
  </TextField>
)

/**
 * 目標設定ダイアログで使う数値入力欄を描画する。
 *
 * @param props - 表示ラベル、入力値、補足説明、数値制約、無効状態、変更ハンドラ。
 * @returns Kobalte NumberField を使った入力欄。
 */
export const GoalNumberField: Component<GoalNumberFieldProps> = (props) => (
  <NumberField
    class="block text-sm"
    value={props.value}
    onChange={props.onChange}
    disabled={props.disabled}
    format={false}
    allowedInput={/[0-9.]/}
    step={props.step ?? 1}
  >
    <NumberField.Label class="mb-1 block text-text-muted">{props.label}</NumberField.Label>
    <NumberField.Input
      class={`${GOAL_FIELD_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
    />
    <Show when={props.description}>
      <NumberField.Description class="mt-1 text-xs text-text-muted">
        {props.description}
      </NumberField.Description>
    </Show>
  </NumberField>
)

/**
 * 目標設定ダイアログで使う単一選択欄を描画する。
 *
 * @param props - 表示ラベル、選択値、選択肢、変更ハンドラ。
 * @returns Kobalte Select を使った単一選択欄。
 */
export const GoalSelectField = <TValue extends string>(props: GoalSelectFieldProps<TValue>) => {
  const selectedOption = () => props.options.find((option) => option.value === props.value) ?? null

  return (
    <FormSelect<GoalSelectOption<TValue>>
      rootClass="block text-sm"
      label={props.label}
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      value={selectedOption()}
      onChange={(option: GoalSelectOption<TValue> | null) => {
        if (option) {
          props.onChange(option.value)
        }
      }}
      placeholder="選択..."
      formatLabel={(option) => option.label}
    />
  )
}

/**
 * 目標設定ダイアログで使うフィルター用チェックボックスを描画する。
 *
 * @param props - 表示ラベル、選択状態、選択変更ハンドラ。
 * @returns Kobalte Checkbox を使ったチェックボックス要素。
 */
export const GoalFilterCheckbox: Component<GoalFilterCheckboxProps> = (props) => (
  <Checkbox
    class="relative flex items-center gap-2 text-sm text-text-muted data-disabled:cursor-not-allowed data-disabled:opacity-45"
    checked={props.checked}
    disabled={props.disabled}
    onChange={props.onChange}
  >
    <Checkbox.Input style={{ left: '0', top: '0' }} />
    <Checkbox.Control class={GOAL_FILTER_CHECKBOX_CONTROL_CLASS}>
      <Checkbox.Indicator>
        <Check class="h-4 w-4" />
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label>{props.label}</Checkbox.Label>
  </Checkbox>
)

/**
 * 目標値の指定方法をラジオボタンで選択する欄を描画する。
 *
 * @param props - 表示ラベル、name属性、選択値、選択肢、変更ハンドラ、追加内容の描画関数。
 * @returns Kobalte RadioGroup を使った目標値指定方法の選択欄。
 */
export const GoalTargetModeRadioGroup = <TValue extends string>(
  props: GoalTargetModeRadioGroupProps<TValue>
) => (
  <RadioGroup
    name={props.name}
    value={props.value}
    onChange={(value) => props.onChange(value as TValue)}
    class="space-y-2 text-sm"
  >
    <RadioGroup.Label class="block text-text-muted">{props.label}</RadioGroup.Label>
    <div class="space-y-2">
      <For each={props.options}>
        {(option) => (
          <div
            class={`${GOAL_RADIO_CARD_BASE_CLASS} ${
              props.value === option.value
                ? GOAL_RADIO_CARD_CHECKED_CLASS
                : GOAL_RADIO_CARD_UNCHECKED_CLASS
            }`}
          >
            <RadioGroup.Item value={option.value} class={GOAL_RADIO_ITEM_CLASS}>
              <RadioGroup.ItemInput class="peer" />
              <RadioGroup.ItemControl class={GOAL_RADIO_CONTROL_CLASS}>
                <RadioGroup.ItemIndicator class="h-2.5 w-2.5 rounded-full bg-action-primary" />
              </RadioGroup.ItemControl>
              <span class="pointer-events-none">{option.label}</span>
              <RadioGroup.ItemLabel class="absolute inset-0 cursor-pointer rounded focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring">
                <span class="sr-only">{option.label}</span>
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
            <Show when={props.renderOptionContent?.(option)}>
              {(content) => <div class="relative z-10 mt-3 pl-8">{content()}</div>}
            </Show>
          </div>
        )}
      </For>
    </div>
  </RadioGroup>
)
