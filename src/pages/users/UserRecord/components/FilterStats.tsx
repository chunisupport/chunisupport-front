import { Collapsible } from '@kobalte/core/collapsible'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import type { RecordStats } from '../utils/recordStats'
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

/** 帯グラフ */
const DistributionBar: Component<{
  dist: Record<string, { count: number; percent: number }>
  order: string[]
  colorMap: Record<string, string>
}> = (props) => (
  <div class="flex w-full h-4 rounded overflow-hidden mb-1 divide-x divide-border">
    <For each={props.order.filter((key) => props.dist[key])}>
      {(key) => {
        const { percent } = props.dist[key]
        return (
          <div
            class={`${props.colorMap[key]} h-full`}
            style={{ width: `${percent}%` }}
            title={key}
          ></div>
        )
      }}
    </For>
  </div>
)

/** スコア統計用の箱ひげ図 */
const ScoreBoxPlot: Component<{ stats: RecordStats['scoreStats'] }> = (props) => {
  const { min, q1, median, q3, max } = props.stats
  const toPct = (value: number) => ((value - min) / (max - min)) * 100
  const q1Pct = toPct(q1)
  const medianPct = toPct(median)
  const q3Pct = toPct(q3)

  return (
    <div class="relative w-full h-4 rounded mb-1">
      <div class="absolute left-0 top-1/2 w-full h-full -translate-y-1/2 bg-action-secondary rounded">
        {/* 既プレイの分布をざっくり掴むための箱ひげ図 */}
        <div
          class="absolute h-full bg-action-primary rounded"
          style={{
            left: `${q1Pct}%`,
            width: `${q3Pct - q1Pct}%`,
          }}
        ></div>
        <div
          class="absolute w-1 bg-action-primary-hover h-full rounded"
          style={{
            left: `${medianPct}%`,
          }}
        ></div>
      </div>
    </div>
  )
}

const FilterStats: Component<FilterStatsProps> = (props) => (
  <Collapsible
    class="mb-2 px-2 border border-border-strong rounded-sm"
    open={props.open}
    onOpenChange={props.onOpenChange}
  >
    <Collapsible.Trigger class="flex h-[36px] w-full items-center gap-1 group">
      <span class="mr-1 group-data-expanded:rotate-90">▶</span>
      <p class="flex-1 text-left">フィルター統計</p>
      <p>平均スコア: {props.stats.scoreStats.avg.toLocaleString()}</p>
    </Collapsible.Trigger>

    <Collapsible.Content>
      <div class="text-xs space-y-2 py-2">
        <div>
          <b>スコアランク割合:</b>
          <DistributionBar dist={props.stats.rankDist} order={rankOrder} colorMap={rankColorMap} />
          <ul>
            <For each={rankOrder.filter((rank) => props.stats.rankDist[rank])}>
              {(rank) => {
                const { count, percent } = props.stats.rankDist[rank]
                return (
                  <li>
                    {rank}: {count}件 ({percent.toFixed(1)}%)
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
        <div>
          <b>コンボランプ割合:</b>
          <DistributionBar
            dist={props.stats.comboDist}
            order={comboOrder}
            colorMap={comboColorMap}
          />
          <ul>
            <For each={comboOrder.filter((lamp) => props.stats.comboDist[lamp])}>
              {(lamp) => {
                const { count, percent } = props.stats.comboDist[lamp]
                return (
                  <li>
                    {lamp}: {count}件 ({percent.toFixed(1)}%)
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
        <div>
          <b>クリアランプ割合:</b>
          <DistributionBar
            dist={props.stats.clearDist}
            order={clearOrder}
            colorMap={clearColorMap}
          />
          <ul>
            <For each={clearOrder.filter((lamp) => props.stats.clearDist[lamp])}>
              {(lamp) => {
                const { count, percent } = props.stats.clearDist[lamp]
                return (
                  <li>
                    {lamp}: {count}件 ({percent.toFixed(1)}%)
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
        {props.stats.scoreStats.max !== props.stats.scoreStats.min ? (
          <div>
            <b>スコア分布(既プレイのみ):</b>
            <ScoreBoxPlot stats={props.stats.scoreStats} />
            <ul>
              <li>最小: {props.stats.scoreStats.min.toLocaleString()}</li>
              <li>最大: {props.stats.scoreStats.max.toLocaleString()}</li>
              <li>平均: {props.stats.scoreStats.avg.toLocaleString()}</li>
              <li>第1四分位数: {props.stats.scoreStats.q1.toLocaleString()}</li>
              <li>中央値: {props.stats.scoreStats.median.toLocaleString()}</li>
              <li>第3四分位数: {props.stats.scoreStats.q3.toLocaleString()}</li>
            </ul>
          </div>
        ) : null}
      </div>
    </Collapsible.Content>
  </Collapsible>
)

export default FilterStats
