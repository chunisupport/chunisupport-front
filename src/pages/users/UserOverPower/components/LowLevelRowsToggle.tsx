import { Button } from '@kobalte/core/button'
import { ChevronRight } from 'lucide-solid'
import type { Component } from 'solid-js'
import { LOW_LEVEL_SUMMARY_LABEL } from '../constants'

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
  <Button
    type="button"
    class="group inline-flex min-h-9 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    aria-expanded={props.expanded}
    aria-controls="over-power-low-level-summary"
    title={`${LOW_LEVEL_SUMMARY_LABEL}を${props.expanded ? '折りたたむ' : '展開'}`}
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
  </Button>
)

export default LowLevelRowsToggle
