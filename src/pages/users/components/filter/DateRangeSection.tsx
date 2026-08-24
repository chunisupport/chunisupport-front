import type { Component } from 'solid-js'
import { RangeControlRow } from '../../../../components/common/RangeInput'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from './styles'

type DateRangeSectionProps = {
  /** 下限の現在の入力値 (YYYY-MM-DD) */
  minValue: string
  /** 上限の現在の入力値 (YYYY-MM-DD) */
  maxValue: string
  /** 下限の入力中値の変更通知 */
  onMinInput: (value: string) => void
  /** 上限の入力中値の変更通知 */
  onMaxInput: (value: string) => void
  /** 下限の確定値を通知する処理 */
  onMinCommit: (value: string) => void
  /** 上限の確定値を通知する処理 */
  onMaxCommit: (value: string) => void
}

/**
 * 最終更新日の範囲入力欄を表示する。
 *
 * @param props - 現在値、入力中/確定時の変更ハンドラ。
 * @returns 日付範囲フィルターセクションの JSX 要素。
 */
const DateRangeSection: Component<DateRangeSectionProps> = (props) => (
  <div>
    <div class="mb-1 text-sm font-medium">最終更新日</div>
    <RangeControlRow
      start={
        <input
          type="date"
          id="filter-updated-at-min"
          class={FILTER_DIALOG_FIELD_INPUT_CLASS}
          value={props.minValue}
          autocomplete="off"
          onInput={(event) => props.onMinInput(event.currentTarget.value)}
          onBlur={(event) => props.onMinCommit(event.currentTarget.value)}
        />
      }
      end={
        <input
          type="date"
          id="filter-updated-at-max"
          class={FILTER_DIALOG_FIELD_INPUT_CLASS}
          value={props.maxValue}
          autocomplete="off"
          onInput={(event) => props.onMaxInput(event.currentTarget.value)}
          onBlur={(event) => props.onMaxCommit(event.currentTarget.value)}
        />
      }
    />
  </div>
)

export default DateRangeSection
