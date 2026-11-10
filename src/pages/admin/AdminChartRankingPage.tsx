import { useParams } from '@solidjs/router'
import { createMemo, createResource, For, Show } from 'solid-js'
import { fetchAdminChartRanking } from '../../api/adminChartRankings'
import { LoadError, Loading } from '../../components'
import { DefaultRecordLampBadges } from '../../components/common/record/RecordDisplayParts'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatInteger } from '../../utils/numberFormat'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { getRankingPositionClass } from '../../utils/rankingPosition'
import { formatRatingFixed2 } from '../../utils/ratingFormat'
import { ADMIN_CHART_RANKING_COPY } from './adminChartRanking.constants'
import { formatAdminUserDateTime } from './adminUserDisplay'

type AdminChartRankingRouteParams = {
  displayid: string
  difficulty?: string
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
): string => (typeof value === 'number' ? formatter(value) : ADMIN_CHART_RANKING_COPY.emptyValue)

/**
 * 管理者向け譜面ランキングを表示する。
 *
 * @returns 楽曲・譜面情報とスコアランキングの表。
 */
const AdminChartRankingPage = () => {
  const params = useParams<AdminChartRankingRouteParams>()
  const request = createMemo(() => ({
    displayId: params.displayid,
    difficulty: params.difficulty?.toUpperCase(),
  }))
  const [ranking] = createResource(request, fetchAdminChartRanking)

  useDocumentTitle(ADMIN_CHART_RANKING_COPY.title)

  return (
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{ADMIN_CHART_RANKING_COPY.title}</h1>

      <Show
        when={!ranking.loading}
        fallback={
          <div class="h-40">
            <Loading />
          </div>
        }
      >
        <Show when={!ranking.error} fallback={<LoadError error={ranking.error} />}>
          <Show when={ranking()} keyed>
            {(data) => (
              <>
                <section class="rounded-lg border border-border bg-surface p-4">
                  <h2 class="font-sans text-xl font-semibold text-text">{data.song.title}</h2>
                  <p class="font-sans text-sm text-text-muted">{data.song.artist}</p>
                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                    <span>{data.chart.difficulty}</span>
                    <Show
                      when={!data.chart.is_worldsend}
                      fallback={
                        <>
                          <span>
                            {ADMIN_CHART_RANKING_COPY.worldsendLevelPrefix}
                            {data.chart.level_star ?? ADMIN_CHART_RANKING_COPY.emptyValue}
                          </span>
                          <span>{data.chart.attribute ?? ADMIN_CHART_RANKING_COPY.emptyValue}</span>
                        </>
                      }
                    >
                      <span>
                        {ADMIN_CHART_RANKING_COPY.chartConstantPrefix}{' '}
                        {data.chart.is_const_unknown
                          ? ADMIN_CHART_RANKING_COPY.unknownValue
                          : data.chart.const}
                      </span>
                    </Show>
                    <span>
                      {ADMIN_CHART_RANKING_COPY.total}: {formatInteger(data.total)}
                    </span>
                  </div>
                </section>

                <Show
                  when={data.ranking.length > 0}
                  fallback={
                    <p class="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-muted">
                      {ADMIN_CHART_RANKING_COPY.empty}
                    </p>
                  }
                >
                  <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                    <table class="min-w-full text-sm">
                      <caption class="sr-only">{ADMIN_CHART_RANKING_COPY.tableCaption}</caption>
                      <thead class="bg-surface-muted">
                        <tr>
                          <th scope="col" class="px-3 py-2 text-center whitespace-nowrap">
                            {ADMIN_CHART_RANKING_COPY.rankColumn}
                          </th>
                          <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                            {ADMIN_CHART_RANKING_COPY.playerColumn}
                          </th>
                          <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                            {ADMIN_CHART_RANKING_COPY.scoreColumn}
                          </th>
                          <Show when={!data.chart.is_worldsend}>
                            <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                              {ADMIN_CHART_RANKING_COPY.ratingColumn}
                            </th>
                            <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                              {ADMIN_CHART_RANKING_COPY.overpowerColumn}
                            </th>
                            <th scope="col" class="px-3 py-2 text-right whitespace-nowrap">
                              {ADMIN_CHART_RANKING_COPY.overpowerPercentColumn}
                            </th>
                          </Show>
                          <th scope="col" class="px-3 py-2 text-center whitespace-nowrap">
                            {ADMIN_CHART_RANKING_COPY.lampColumn}
                          </th>
                          <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                            {ADMIN_CHART_RANKING_COPY.updatedAtColumn}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={data.ranking}>
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
                                <div class="font-sans font-medium text-text">
                                  {entry.player_name}
                                </div>
                                <div class="font-sans text-xs text-text-muted">
                                  {ADMIN_CHART_RANKING_COPY.usernamePrefix}
                                  {entry.username}
                                </div>
                              </td>
                              <td class="px-3 py-2 text-right font-oswald text-base whitespace-nowrap tabular-nums">
                                {formatInteger(entry.score)}
                              </td>
                              <Show when={!data.chart.is_worldsend}>
                                <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                                  {formatOptionalNumber(entry.rating, formatRatingFixed2)}
                                </td>
                                <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                                  {formatOptionalNumber(entry.overpower, formatOverPowerValue)}
                                </td>
                                <td class="px-3 py-2 text-right font-oswald whitespace-nowrap tabular-nums">
                                  {formatOptionalNumber(
                                    entry.overpower_percent,
                                    formatOverPowerPercent
                                  )}
                                </td>
                              </Show>
                              <td class="px-3 py-2 whitespace-nowrap">
                                <DefaultRecordLampBadges record={entry} class="justify-center" />
                              </td>
                              <td class="px-3 py-2 whitespace-nowrap">
                                {formatAdminUserDateTime(entry.updated_at)}
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              </>
            )}
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default AdminChartRankingPage
