import { useParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchAdminChartRanking } from '../../api/adminChartRankings'
import { LoadError, Loading } from '../../components'
import { DefaultRecordLampBadges } from '../../components/common/record/RecordDisplayParts'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatInteger } from '../../utils/numberFormat'
import AdminRankingTable from './AdminRankingTable'
import { ADMIN_RANKING_COPY } from './adminRanking.constants'

type AdminChartRankingRouteParams = {
  displayid: string
  difficulty?: string
}

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

  useDocumentTitle(ADMIN_RANKING_COPY.chartTitle)

  return (
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{ADMIN_RANKING_COPY.chartTitle}</h1>

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
                            {ADMIN_RANKING_COPY.worldsendLevelPrefix}
                            {data.chart.level_star ?? ADMIN_RANKING_COPY.emptyValue}
                          </span>
                          <span>{data.chart.attribute ?? ADMIN_RANKING_COPY.emptyValue}</span>
                        </>
                      }
                    >
                      <span>
                        {ADMIN_RANKING_COPY.chartConstantPrefix}{' '}
                        {data.chart.is_const_unknown
                          ? ADMIN_RANKING_COPY.unknownValue
                          : data.chart.const}
                      </span>
                    </Show>
                    <span>
                      {ADMIN_RANKING_COPY.total}: {formatInteger(data.total)}
                    </span>
                  </div>
                </section>

                <AdminRankingTable
                  caption={ADMIN_RANKING_COPY.chartTableCaption}
                  entries={data.ranking}
                  showChartMetrics={!data.chart.is_worldsend}
                  renderLamps={(entry) => (
                    <DefaultRecordLampBadges record={entry} class="justify-center" />
                  )}
                />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default AdminChartRankingPage
