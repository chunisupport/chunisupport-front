import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import type { NumericRangeFilterConfig } from '../../../constants/rangeFilters'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from '../styles'
import RangeSeparator from './RangeSeparator'

type NumericRangeSectionProps = {
  config: NumericRangeFilterConfig
  minValue: string
  maxValue: string
  onMinInput: (value: string) => void
  onMaxInput: (value: string) => void
  onMinCommit: (value: string) => void
  onMaxCommit: (value: string) => void
}

/**
 * 範囲入力欄へ入力できる文字だけを残す。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param allowedInput - 許可する1文字を表す正規表現。
 * @returns 許可文字だけで構成された入力値。
 */
const sanitizeRangeInput = (value: string, allowedInput: RegExp): string =>
  Array.from(value)
    .filter((char) => allowedInput.test(char))
    .join('')

/**
 * 空欄を許す数値範囲フィルターの入力欄を表示する。
 *
 * @param props - 入力欄設定、現在値、入力中/確定時の変更ハンドラ。
 * @returns 数値範囲フィルターセクションの JSX 要素。
 */
const NumericRangeSection: Component<NumericRangeSectionProps> = (props) => (
  <div>
    <div class="mb-1 text-sm font-medium">{props.config.title}</div>
    <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
      <div class="min-w-0">
        <TextField value={props.minValue} class="w-full">
          <TextField.Label class="sr-only">{props.config.minLabel}</TextField.Label>
          <TextField.Input
            id={`filter-${props.config.idPrefix}-min`}
            inputMode={props.config.inputMode}
            pattern={props.config.pattern}
            class={FILTER_DIALOG_FIELD_INPUT_CLASS}
            value={props.minValue}
            onInput={(event) =>
              props.onMinInput(
                sanitizeRangeInput(event.currentTarget.value, props.config.allowedInput)
              )
            }
            onFocus={(event) => event.currentTarget.select()}
            onBlur={(event) => props.onMinCommit(event.currentTarget.value)}
          />
        </TextField>
      </div>
      <RangeSeparator />
      <div class="min-w-0">
        <TextField value={props.maxValue} class="w-full">
          <TextField.Label class="sr-only">{props.config.maxLabel}</TextField.Label>
          <TextField.Input
            id={`filter-${props.config.idPrefix}-max`}
            inputMode={props.config.inputMode}
            pattern={props.config.pattern}
            class={FILTER_DIALOG_FIELD_INPUT_CLASS}
            value={props.maxValue}
            onInput={(event) =>
              props.onMaxInput(
                sanitizeRangeInput(event.currentTarget.value, props.config.allowedInput)
              )
            }
            onFocus={(event) => event.currentTarget.select()}
            onBlur={(event) => props.onMaxCommit(event.currentTarget.value)}
          />
        </TextField>
      </div>
    </div>
  </div>
)

export default NumericRangeSection
