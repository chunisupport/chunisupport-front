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

/**
 * フィルター適用結果の分布を折りたたみ表示する。
 * スコア分布の詳細表示は削除済み。ヘッダーには平均スコアのみ表示。
 * @param props - 集計済み統計、開閉状態、開閉ハンドラ。
 * @returns フィルター統計表示コンポーネント。
 */
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
      </div>
    </Collapsible.Content>
  </Collapsible>
)

export default FilterStats
