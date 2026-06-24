import { Collapsible } from '@kobalte/core/collapsible'
import * as Tabs from '@kobalte/core/tabs'
import { ChevronRight, Link2, ShieldCheck, Trophy } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import type { DistributionMap, RecordStats } from '../utils/recordStats'
import {
  clearColorMap,
  clearOrder,
  comboColorMap,
  comboOrder,
  rankColorMap,
  rankOrder,
} from '../utils/recordStats'

type FilterStatsProps = {
  stats: RecordStats
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DistributionSectionConfig = {
  title: string
  label: string
  order: string[]
  colorMap: Record<string, string>
  dist: DistributionMap
  Icon: Component<{ class?: string; 'aria-hidden'?: boolean }>
  hiddenGraphKeys?: readonly string[]
}

type FilterStatsTabValue = 'score' | 'combo' | 'clear'

const FILTER_STATS_CARD_CLASS =
  'overflow-hidden rounded-lg border border-border-strong bg-surface shadow-sm'
const FILTER_STATS_HEADER_CLASS =
  'flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2 text-sm font-bold'
const FILTER_STATS_ROW_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto_2.5rem_minmax(3.25rem,5rem)] items-center gap-2 py-1.5 text-xs'
/** フィルター統計タブの通常、ホバー、選択中状態を表す表示クラス。 */
const FILTER_STATS_TAB_TRIGGER_CLASS =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-action-secondary hover:text-text data-selected:bg-action-primary data-selected:text-text-inverse data-selected:shadow-sm data-selected:hover:bg-action-primary data-selected:hover:text-text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

/**
 * フィルター統計タブの選択肢を表示する。
 * @param props - タブ値、ラベル、アイコン。
 * @returns タブ切り替えボタン。
 */
const FilterStatsTabTrigger: Component<{
  value: FilterStatsTabValue
  label: string
  Icon: Component<{ class?: string; 'aria-hidden'?: boolean }>
}> = (props) => (
  <Tabs.Trigger value={props.value} class={FILTER_STATS_TAB_TRIGGER_CLASS}>
    <props.Icon class="h-3.5 w-3.5" aria-hidden={true} />
    <span>{props.label}</span>
  </Tabs.Trigger>
)

/**
 * 分布の表示対象キーを、指定順を保ったまま取得する。
 * @param dist - 集計済みの分布。
 * @param order - 表示順。
 * @returns 件数が存在する分布キー。
 */
const getVisibleDistributionKeys = (dist: DistributionMap, order: string[]) =>
  order.filter((key) => dist[key])

/**
 * 割合バーの幅をCSS値へ変換する。
 * @param percent - 0から100までの割合。
 * @returns 表示用のwidth値。
 */
const getPercentWidth = (percent: number) => (percent > 0 ? `max(2px, ${percent}%)` : '0')

/**
 * 分布の構成比を帯グラフで表示する。
 * @param props - 分布、表示順、色クラス、グラフ非表示キー。
 * @returns 分布帯グラフコンポーネント。
 */
const DistributionBar: Component<{
  dist: DistributionMap
  order: string[]
  colorMap: Record<string, string>
  hiddenGraphKeys?: readonly string[]
}> = (props) => (
  <div class="flex h-5 w-full overflow-hidden rounded bg-surface-hover">
    <For each={getVisibleDistributionKeys(props.dist, props.order)}>
      {(key) => (
        <div
          class={`${props.hiddenGraphKeys?.includes(key) ? 'bg-transparent' : props.colorMap[key]} h-full`}
          style={{ width: `${props.dist[key].percent}%` }}
          title={key}
        ></div>
      )}
    </For>
  </div>
)

/**
 * 分布の1行分を件数、割合、ミニバーで表示する。
 * @param props - 表示ラベル、分布値、色クラス。
 * @returns 分布行コンポーネント。
 */
const DistributionRow: Component<{
  label: string
  count: number
  percent: number
  colorClass: string
  hideGraph?: boolean
}> = (props) => (
  <li class={FILTER_STATS_ROW_CLASS}>
    <div class="flex min-w-0 items-center gap-2 font-semibold">
      <span class={`${props.colorClass} h-2.5 w-2.5 shrink-0 rounded-full`} aria-hidden="true" />
      <span class="truncate">{props.label}</span>
    </div>
    <span class="whitespace-nowrap text-right tabular-nums">{props.count.toLocaleString()}件</span>
    <span class="whitespace-nowrap text-right tabular-nums text-text-muted">
      {props.percent.toFixed(1)}%
    </span>
    <div class="h-3 overflow-hidden rounded-sm bg-surface-hover" aria-hidden="true">
      <div
        class={`${props.hideGraph ? 'bg-transparent' : props.colorClass} h-full`}
        style={{ width: getPercentWidth(props.percent) }}
      />
    </div>
  </li>
)

/**
 * フィルター統計の分布カードを表示する。
 * @param props - カード見出し、分布、表示順、色クラス、アイコン。
 * @returns 分布カードコンポーネント。
 */
const DistributionSection: Component<DistributionSectionConfig> = (props) => (
  <section class={FILTER_STATS_CARD_CLASS} aria-label={props.label}>
    <div class={FILTER_STATS_HEADER_CLASS}>
      <props.Icon class="h-4 w-4 text-success" aria-hidden={true} />
      <h3>{props.title}</h3>
    </div>
    <div class="space-y-3 p-3">
      <DistributionBar
        dist={props.dist}
        order={props.order}
        colorMap={props.colorMap}
        hiddenGraphKeys={props.hiddenGraphKeys}
      />
      <ul class="divide-y divide-border">
        <For each={getVisibleDistributionKeys(props.dist, props.order)}>
          {(key) => (
            <DistributionRow
              label={key}
              count={props.dist[key].count}
              percent={props.dist[key].percent}
              colorClass={props.colorMap[key]}
              hideGraph={props.hiddenGraphKeys?.includes(key)}
            />
          )}
        </For>
      </ul>
    </div>
  </section>
)

/**
 * フィルター適用結果の分布を折りたたみ表示する。
 * スコア分布の詳細表示は削除済み。ヘッダーには平均スコアのみ表示。
 * @param props - 集計済み統計、開閉状態、開閉ハンドラ。
 * @returns フィルター統計表示コンポーネント。
 */
const FilterStats: Component<FilterStatsProps> = (props) => (
  <Collapsible
    class="mb-3 rounded-lg border border-border-strong bg-surface"
    open={props.open}
    onOpenChange={props.onOpenChange}
  >
    <Collapsible.Trigger class="group flex min-h-10 w-full items-center gap-2 px-3 text-sm">
      <ChevronRight
        class="h-4 w-4 text-text-muted transition-transform group-data-expanded:rotate-90"
        aria-hidden="true"
      />
      <p class="flex-1 text-left font-semibold">フィルター統計</p>
      <p class="text-sm text-text-muted">
        平均スコア: {props.stats.scoreStats.avg.toLocaleString()}
      </p>
    </Collapsible.Trigger>

    <Collapsible.Content>
      <div class="border-t border-border p-3">
        <Tabs.Root defaultValue="score">
          <Tabs.List class="mb-3 inline-flex gap-1 rounded-lg bg-surface-hover p-1">
            <FilterStatsTabTrigger value="score" label="RANK" Icon={Trophy} />
            <FilterStatsTabTrigger value="combo" label="COMBO" Icon={Link2} />
            <FilterStatsTabTrigger value="clear" label="HARD" Icon={ShieldCheck} />
          </Tabs.List>

          <Tabs.Content value="score">
            <DistributionSection
              title="RANK"
              label="RANK"
              dist={props.stats.rankDist}
              order={rankOrder}
              colorMap={rankColorMap}
              Icon={Trophy}
              hiddenGraphKeys={['OTHERS']}
            />
          </Tabs.Content>
          <Tabs.Content value="combo">
            <DistributionSection
              title="COMBO"
              label="COMBO"
              dist={props.stats.comboDist}
              order={comboOrder}
              colorMap={comboColorMap}
              Icon={Link2}
            />
          </Tabs.Content>
          <Tabs.Content value="clear">
            <DistributionSection
              title="HARD"
              label="HARD"
              dist={props.stats.clearDist}
              order={clearOrder}
              colorMap={clearColorMap}
              Icon={ShieldCheck}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Collapsible.Content>
  </Collapsible>
)

export default FilterStats
