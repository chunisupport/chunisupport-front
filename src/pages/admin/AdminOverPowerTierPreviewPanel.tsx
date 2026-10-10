import type { Component } from 'solid-js'
import { For } from 'solid-js'
import { OverPowerTierValue } from '../../components/common/OverPowerTierValue'
import { getPossessionClassName, POSSESSION_NAMES } from '../../constants/possession'
import type { PossessionName } from '../../types/api'
import { formatOverPowerValue } from '../../utils/overPowerFormat'
import {
  ADMIN_OVER_POWER_TIER_PREVIEW_COPY,
  OVER_POWER_TIER_PREVIEW_SAMPLES,
} from './AdminOverPowerTierPreviewPanel.constants'

type SampleRowProps = {
  /** 背景に使うポゼッション。normal はテーマのサーフェス色 */
  possessionName: PossessionName
}

/**
 * 1つの背景上に、全段階のOVER POWER数値をOVER POWERタブのカードと同じ文字サイズで並べる。
 *
 * @param props - 背景に使うポゼッション。
 * @returns 段階ごとのOVER POWER数値サンプル。
 */
const SampleRow: Component<SampleRowProps> = (props) => (
  <section
    class={`user-nameplate rounded-md px-3 py-3 ${getPossessionClassName(props.possessionName)}`}
  >
    <h3 class="mb-2 font-sans text-sm">{props.possessionName}</h3>
    <div class="flex flex-wrap gap-x-6 gap-y-2">
      <For each={OVER_POWER_TIER_PREVIEW_SAMPLES}>
        {(sample) => (
          <p class="text-xl font-bold tabular-nums">
            <OverPowerTierValue
              percent={sample.percent}
              text={formatOverPowerValue(sample.value)}
            />
            <span class="ml-1 text-sm font-normal">{sample.tier}</span>
          </p>
        )}
      </For>
    </div>
  </section>
)

/**
 * OVER POWER数値の色段階を、テーマ背景と各ポゼッション背景の上で確認する。
 *
 * @returns OVER POWER数値色の確認画面。
 */
const AdminOverPowerTierPreviewPanel = () => (
  <div class="mx-auto w-full max-w-6xl space-y-6">
    <section>
      <h2 class="mb-4 text-xl font-semibold">
        {ADMIN_OVER_POWER_TIER_PREVIEW_COPY.surfaceHeading}
      </h2>
      <div class="rounded-lg border border-border bg-surface p-4">
        <SampleRow possessionName="normal" />
      </div>
    </section>
    <section>
      <h2 class="mb-4 text-xl font-semibold">
        {ADMIN_OVER_POWER_TIER_PREVIEW_COPY.possessionHeading}
      </h2>
      <div class="space-y-4">
        <For each={POSSESSION_NAMES.filter((name) => name !== 'normal')}>
          {(possessionName) => <SampleRow possessionName={possessionName} />}
        </For>
      </div>
    </section>
  </div>
)

export default AdminOverPowerTierPreviewPanel
