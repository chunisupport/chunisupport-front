import { formatMessage } from '../../../../i18n'
import { ChevronRight } from 'lucide-solid'
import type { Component } from 'solid-js'
import { AppButton } from '../../../../components/common/AppButton'
import { LOW_LEVEL_SUMMARY_LABEL, OVER_POWER_COPY } from '../constants'

type LowLevelRowsToggleProps = {
  expanded: boolean
  chartCount: number
  onClick: () => void
}

/**
 * レベル別集計の低レベル帯を開閉するボタンを表示する。
 *
 * @param props - 開閉状態、対象譜面数、および開閉ハンドラ。
 * @returns レベル1から9+の表示を切り替えるボタン。
 */
const LowLevelRowsToggle: Component<LowLevelRowsToggleProps> = (props) => (
  <AppButton
    variant="surface"
    size="sm"
    shape="pill"
    class="group min-h-9 font-semibold focus-visible:ring-offset-2"
    aria-expanded={props.expanded}
    aria-controls="over-power-low-level-summary"
    title={formatMessage(
      props.expanded ? OVER_POWER_COPY.collapse : OVER_POWER_COPY.expand,
      { label: LOW_LEVEL_SUMMARY_LABEL }
    )}
    onClick={props.onClick}
  >
    <ChevronRight
      class="h-4 w-4 transition-transform group-aria-expanded:rotate-90"
      aria-hidden="true"
    />
    <span>{LOW_LEVEL_SUMMARY_LABEL}</span>
    <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-text-subtle">
      {props.chartCount}
    </span>
  </AppButton>
)

export default LowLevelRowsToggle
