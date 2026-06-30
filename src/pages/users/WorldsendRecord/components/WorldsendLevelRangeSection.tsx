import { Select } from '@kobalte/core/select'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { WORLDSEND_LEVEL_STAR_OPTIONS } from '../../../../constants/chart'
import RangeSeparator, {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
} from '../../components/filter/RangeSeparator'
import {
  FILTER_DIALOG_SELECT_CONTENT_CLASS,
  FILTER_DIALOG_SELECT_ITEM_CLASS,
  FILTER_DIALOG_SELECT_TRIGGER_CLASS,
} from '../../components/filter/styles'
import { formatWorldsendLevelStar } from '../utils/filterDialog'

const WORLDSEND_LEVEL_RANGE_TITLE = 'レベル'

type WorldsendLevelRangeSectionProps = {
  minValue: number
  maxValue: number
  onChange: (type: 'min' | 'max', value: number) => void
}

/**
 * WORLD'S END の★レベル範囲をプルダウンで選択するセクションを表示する。
 *
 * @param props - 現在の範囲値と変更ハンドラー。
 * @returns ★レベル範囲選択セクションの JSX 要素。
 */
const WorldsendLevelRangeSection: Component<WorldsendLevelRangeSectionProps> = (props) => (
  <div>
    <div class="mb-1 text-sm font-medium">{WORLDSEND_LEVEL_RANGE_TITLE}</div>
    <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
      <div class="min-w-0">
        <Select<number>
          options={WORLDSEND_LEVEL_STAR_OPTIONS}
          value={props.minValue}
          onChange={(value) => {
            if (value !== null) props.onChange('min', value)
          }}
          class="w-full"
          placeholder="選択…"
          gutter={0}
          itemComponent={(itemProps) => (
            <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
              <Select.ItemLabel>
                {formatWorldsendLevelStar(itemProps.item.rawValue)}
              </Select.ItemLabel>
              <Select.ItemIndicator class="indicator inline-flex h-5 w-5 items-center justify-center">
                <Check />
              </Select.ItemIndicator>
            </Select.Item>
          )}
        >
          <Select.Label class="sr-only">
            {WORLDSEND_LEVEL_RANGE_TITLE} {RANGE_START_LABEL_SUFFIX}
          </Select.Label>
          <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
            <Select.Value<number> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
              {(state) => formatWorldsendLevelStar(state.selectedOption() ?? null)}
            </Select.Value>
            <Select.Icon class="flex h-5 w-5 items-center justify-center">
              <ChevronDown />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content class={FILTER_DIALOG_SELECT_CONTENT_CLASS}>
              <Select.Listbox />
            </Select.Content>
          </Select.Portal>
        </Select>
      </div>
      <RangeSeparator />
      <div class="min-w-0">
        <Select<number>
          options={WORLDSEND_LEVEL_STAR_OPTIONS}
          value={props.maxValue}
          onChange={(value) => {
            if (value !== null) props.onChange('max', value)
          }}
          class="w-full"
          placeholder="選択…"
          gutter={0}
          itemComponent={(itemProps) => (
            <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
              <Select.ItemLabel>
                {formatWorldsendLevelStar(itemProps.item.rawValue)}
              </Select.ItemLabel>
              <Select.ItemIndicator class="indicator inline-flex h-5 w-5 items-center justify-center">
                <Check />
              </Select.ItemIndicator>
            </Select.Item>
          )}
        >
          <Select.Label class="sr-only">
            {WORLDSEND_LEVEL_RANGE_TITLE} {RANGE_END_LABEL_SUFFIX}
          </Select.Label>
          <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
            <Select.Value<number> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
              {(state) => formatWorldsendLevelStar(state.selectedOption() ?? null)}
            </Select.Value>
            <Select.Icon class="flex h-5 w-5 items-center justify-center">
              <ChevronDown />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content class={FILTER_DIALOG_SELECT_CONTENT_CLASS}>
              <Select.Listbox />
            </Select.Content>
          </Select.Portal>
        </Select>
      </div>
    </div>
  </div>
)

export default WorldsendLevelRangeSection
