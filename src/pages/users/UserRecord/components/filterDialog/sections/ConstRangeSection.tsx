import { Checkbox } from '@kobalte/core/checkbox'
import { NumberField } from '@kobalte/core/number-field'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { AppSelect } from '../../../../../../components/common/AppSelect'
import { CHART_CONST_MAX, CHART_CONST_MIN } from '../../../../../../constants/chart'
import RangeSeparator, {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
} from '../../../../components/filter/RangeSeparator'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from '../../../../components/filter/styles'

/** レベル範囲セクションの見出し。 */
const CONST_LEVEL_RANGE_TITLE = 'レベル'

/** 譜面定数範囲セクションの見出し。 */
const CONST_VALUE_RANGE_TITLE = '譜面定数'

const CONST_LEVEL_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '7+',
  '8',
  '8+',
  '9',
  '9+',
  '10',
  '10+',
  '11',
  '11+',
  '12',
  '12+',
  '13',
  '13+',
  '14',
  '14+',
  '15',
  '15+',
  '16',
]

type ConstRangeSectionProps = {
  constFilterMode: 'level' | 'number'
  minValue: string
  maxValue: string
  constLevelMin: string
  constLevelMax: string
  onMinInput: (value: string) => void
  onMaxInput: (value: string) => void
  onMinCommit: (value: string) => void
  onMaxCommit: (value: string) => void
  onConstFilterModeChange: (mode: 'level' | 'number') => void
  onConstLevelChange: (type: 'min' | 'max', value: string) => void
}

/**
 * レベルまたは譜面定数の範囲条件を表示する。
 *
 * @param props - 範囲入力値、入力モード、選択値、各変更ハンドラ。
 * @returns 定数範囲フィルターセクションの JSX 要素。
 */
const ConstRangeSection: Component<ConstRangeSectionProps> = (props) => (
  <div>
    {props.constFilterMode === 'number' ? (
      <>
        <div class="mb-1 text-sm font-medium">{CONST_VALUE_RANGE_TITLE}</div>
        <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
          <div class="min-w-0">
            <NumberField
              value={props.minValue}
              onChange={(value: string) => props.onMinInput(value)}
              class="w-full"
              format={false}
              allowedInput={/[0-9.]/}
              step={0.1}
            >
              <NumberField.Label class="sr-only">
                {CONST_VALUE_RANGE_TITLE} {RANGE_START_LABEL_SUFFIX}
              </NumberField.Label>
              <NumberField.Input
                id="filter-const-min"
                class={FILTER_DIALOG_FIELD_INPUT_CLASS}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => props.onMinCommit(event.currentTarget.value)}
              />
            </NumberField>
          </div>
          <RangeSeparator />
          <div class="min-w-0">
            <NumberField
              value={props.maxValue}
              onChange={(value: string) => props.onMaxInput(value)}
              class="w-full"
              format={false}
              allowedInput={/[0-9.]/}
              step={0.1}
            >
              <NumberField.Label class="sr-only">
                {CONST_VALUE_RANGE_TITLE} {RANGE_END_LABEL_SUFFIX}
              </NumberField.Label>
              <NumberField.Input
                id="filter-const-max"
                min={CHART_CONST_MIN}
                max={CHART_CONST_MAX}
                step={0.1}
                class={FILTER_DIALOG_FIELD_INPUT_CLASS}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => props.onMaxCommit(event.currentTarget.value)}
              />
            </NumberField>
          </div>
        </div>
      </>
    ) : (
      <>
        <div class="mb-1 text-sm font-medium">{CONST_LEVEL_RANGE_TITLE}</div>
        <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
          <div class="min-w-0">
            <AppSelect
              options={CONST_LEVEL_OPTIONS}
              value={props.constLevelMin}
              onChange={(value: string | null) => {
                if (value !== null) props.onConstLevelChange('min', value)
              }}
              rootClass="w-full"
              label={`${CONST_LEVEL_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`}
              labelVariant="srOnly"
              placeholder="選択…"
            />
          </div>
          <RangeSeparator />
          <div class="min-w-0">
            <AppSelect
              options={CONST_LEVEL_OPTIONS}
              value={props.constLevelMax}
              onChange={(value: string | null) => {
                if (value !== null) props.onConstLevelChange('max', value)
              }}
              rootClass="w-full"
              label={`${CONST_LEVEL_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`}
              labelVariant="srOnly"
              placeholder="選択…"
            />
          </div>
        </div>
      </>
    )}
    <div class="mt-2">
      <Checkbox
        checked={props.constFilterMode === 'number'}
        onChange={(checked) => props.onConstFilterModeChange(checked ? 'number' : 'level')}
        class="flex items-center gap-2"
      >
        <Checkbox.Input id="filter-const-mode" />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for="filter-const-mode">
          譜面定数で指定
        </Checkbox.Label>
      </Checkbox>
    </div>
  </div>
)

export default ConstRangeSection
