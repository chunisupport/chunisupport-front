import type { Component } from 'solid-js'
import { For } from 'solid-js'
import { SiteLogoMark } from '../../../../components/common/SiteLogoMark'
import { SITE_NAME } from '../../../../constants/site'
import {
  OVER_POWER_IMAGE_CARD_GAP,
  OVER_POWER_IMAGE_CARD_WIDTH,
  OVER_POWER_IMAGE_COLUMNS,
  OVER_POWER_IMAGE_COPY,
  OVER_POWER_IMAGE_PADDING,
  OVER_POWER_IMAGE_WIDTH,
} from '../constants'
import type { OverPowerGraphRow } from '../types'
import { OverPowerSummaryCard } from './OverPowerSummaryGraph'

type Props = {
  /** プレイヤー名 */
  playerName: string
  /** 画像へ並べるカードの集計行。画面の表示順で渡す */
  rows: OverPowerGraphRow[]
}

/**
 * OVER POWERのカードを横3枚ずつ並べた、画像化用の固定幅シートを表示する。
 *
 * 画面幅に依存しない論理幅で描画し、レコード遷移などの操作要素は含めない。
 *
 * @param props - プレイヤー名、カードの集計行。
 * @returns 画像化用のシート。
 */
export const OverPowerImageSheet: Component<Props> = (props) => (
  <div
    class="space-y-4 bg-bg font-jost text-text"
    style={{
      width: `${OVER_POWER_IMAGE_WIDTH}px`,
      padding: `${OVER_POWER_IMAGE_PADDING}px`,
    }}
  >
    <header class="flex items-center gap-3">
      <SiteLogoMark class="h-10 w-10 bg-text" />
      <h1 class="shrink-0 whitespace-nowrap font-sans text-2xl font-semibold">
        {OVER_POWER_IMAGE_COPY.sheetTitle}
      </h1>
      <p class="min-w-0 flex-1 truncate text-right font-sans text-xl font-bold">
        {props.playerName}
      </p>
    </header>
    <div
      class="grid"
      style={{
        gap: `${OVER_POWER_IMAGE_CARD_GAP}px`,
        'grid-template-columns': `repeat(${OVER_POWER_IMAGE_COLUMNS}, ${OVER_POWER_IMAGE_CARD_WIDTH}px)`,
      }}
    >
      <For each={props.rows}>{(row) => <OverPowerSummaryCard row={row} imageMode />}</For>
    </div>
    <footer class="text-right font-sans text-sm text-text-muted">
      <span class="whitespace-nowrap">
        {OVER_POWER_IMAGE_COPY.generatedBy} <strong class="font-bold">{SITE_NAME}</strong>
      </span>
    </footer>
  </div>
)
