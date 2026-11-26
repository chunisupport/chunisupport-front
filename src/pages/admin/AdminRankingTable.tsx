import { For, type JSX, Show } from 'solid-js'
import type { AdminChartRankingEntryDTO } from '../../types/api'
import { formatInteger } from '../../utils/numberFormat'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { getRankingPositionClass } from '../../utils/rankingPosition'
import { formatRatingFixed2 } from '../../utils/ratingFormat'
import { ADMIN_RANKING_COPY } from './adminRanking.constants'
import { formatAdminUserDateTime } from './adminUserDisplay'

type RankingEntry = Pick<
  AdminChartRankingEntryDTO,
  | 'rank'
  | 'username'
  | 'player_name'
  | 'score'
  | 'updated_at'
  | 'rating'
  | 'overpower'
  | 'overpower_percent'
>

type Props<Entry extends RankingEntry> = {
  caption: string
  entries: readonly Entry[]
  showChartMetrics?: boolean
  renderLamps: (entry: Entry) => JSX.Element
}

/**
 * 省略可能な数値を指定桁数で表示する。
 *
 * @param value - 表示する数値。
 * @param formatter - 数値を画面表示用に整形する関数。
 * @returns 数値の固定小数点表記。値がない場合はハイフン。
 */
const formatOptionalNumber = (
  value: number | undefined,
  formatter: (target: number) => string
): string => (typeof value === 'number' ? formatter(value) : ADMIN_RANKING_COPY.emptyValue)

/**
 * 管理者向けのスコアランキングを表示する。
 *
 * @param props - 順位付き記録、表の名前とランプの描画方法。
 * @returns 譜面またはコースのスコアランキング表。
 */
const AdminRankingTable = <Entry extends RankingEntry>(props: Props<Entry>) => (
  <Show
    when={props.entries.length > 0}
    fallback={
      <p class="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-muted">
        {ADMIN_RANKING_COPY.empty}
      </p>
    }
  >
    <section
      aria-label={props.caption}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域をキーボードでも操作できるようにする。
      tabIndex={0}
      class="overflow-x-auto rounded-lg border border-border bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <table class="min-w-full text-sm">
        <caption class="sr-only">{props.caption}</caption>
        <thead class="bg-surface-muted">
          <tr>
            <th scope="col" class="px-3 py-2 text-center whitespace-nowrap">
              {ADMIN_RANKING_COPY.rankColumn}
            </th>
            <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
              {ADMIN_RANKING_COPY.playerColumn}
            </th>
            <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
              {ADMIN_RANKING_COPY.scoreColumn}
            </th>
            <Show when={props.showChartMetrics}>
              <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                {ADMIN_RANKING_COPY.ratingColumn}
              </th>
              <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                {ADMIN_RANKING_COPY.overpowerColumn}
              </th>
              <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                {ADMIN_RANKING_COPY.overpowerPercentColumn}
              </th>
            </Show>
            <th scope="col" class="px-3 py-2 text-center whitespace-nowrap">
              {ADMIN_RANKING_COPY.lampColumn}
            </th>
            <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
              {ADMIN_RANKING_COPY.updatedAtColumn}
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={props.entries}>
            {(entry) => (
              <tr class="border-t border-border hover:bg-surface-muted">
                <th scope="row" class="px-3 py-2 text-center font-normal">
                  <span
                    class={`inline-flex h-7 w-7 items-center justify-center rounded-full font-oswald font-semibold ${getRankingPositionClass(
                      entry.rank,
                      'bg-surface-muted text-text-muted'
                    )}`}
                  >
                    {entry.rank}
                  </span>
                </th>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="font-sans font-medium text-text">{entry.player_name}</div>
                  <div class="font-sans text-xs text-text-muted">
                    {ADMIN_RANKING_COPY.usernamePrefix}
                    {entry.username}
                  </div>
                </td>
                <td class="px-3 py-2 text-right font-oswald text-base whitespace-nowrap tabular-nums">
                  {formatInteger(entry.score)}
                </td>
                <Show when={props.showChartMetrics}>
                  <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                    {formatOptionalNumber(entry.rating, formatRatingFixed2)}
                  </td>
                  <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                    {formatOptionalNumber(entry.overpower, formatOverPowerValue)}
                  </td>
                  <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                    {formatOptionalNumber(entry.overpower_percent, formatOverPowerPercent)}
                  </td>
                </Show>
                <td class="px-3 py-2 whitespace-nowrap">{props.renderLamps(entry)}</td>
                <td class="px-3 py-2 whitespace-nowrap">
                  {formatAdminUserDateTime(entry.updated_at)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </section>
  </Show>
)

export default AdminRankingTable
