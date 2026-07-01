import type { Component } from 'solid-js'
import { AppSelect } from '../../../../components/common/AppSelect'
import { WORLDSEND_LEVEL_STAR_OPTIONS } from '../../../../constants/chart'
import RangeSeparator, {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
} from '../../components/filter/RangeSeparator'
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
        <AppSelect<number>
          options={WORLDSEND_LEVEL_STAR_OPTIONS}
          value={props.minValue}
          onChange={(value: number | null) => {
            if (value !== null) props.onChange('min', value)
          }}
          rootClass="w-full"
          label={`${WORLDSEND_LEVEL_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`}
          labelVariant="srOnly"
          placeholder="選択…"
          formatLabel={formatWorldsendLevelStar}
        />
      </div>
      <RangeSeparator />
      <div class="min-w-0">
        <AppSelect<number>
          options={WORLDSEND_LEVEL_STAR_OPTIONS}
          value={props.maxValue}
          onChange={(value: number | null) => {
            if (value !== null) props.onChange('max', value)
          }}
          rootClass="w-full"
          label={`${WORLDSEND_LEVEL_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`}
          labelVariant="srOnly"
          placeholder="選択…"
          formatLabel={formatWorldsendLevelStar}
        />
      </div>
    </div>
  </div>
)

export default WorldsendLevelRangeSection
