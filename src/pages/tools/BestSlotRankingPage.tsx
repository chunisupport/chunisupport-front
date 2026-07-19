import { A } from '@solidjs/router'
import { createEffect, createMemo, createResource, createSignal, For, on, Show } from 'solid-js'
import { fetchBestSlotRanking } from '../../api/bestSlotRankings'
import { fetchRatingBands } from '../../api/ratingBands'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { buildSongDetailPath } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import type { BestSlotRankingEntryDTO, PlayerRecordDTO, RatingBandDTO } from '../../types/api'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { getConstDisplay } from '../../utils/constDisplay'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import { getRankingPositionClass } from '../../utils/rankingPosition'
import { ALL_RATING_BAND_LABEL, resolveInitialBestSlotRatingBand } from '../../utils/ratingBand'
import {
  calculateDisplayedScoreDifference,
  formatScoreDifference,
  getScoreDifferenceClass,
} from '../../utils/scoreDifference'
import {
  BEST_SLOT_PERCENTAGE_DECIMAL_PLACES,
  BEST_SLOT_RANKING_COPY,
} from './bestSlotRanking.constants'

type RatingBandOption = {
  label: string
  value: string
}

/**
 * 楽曲IDと難易度からユーザーレコード参照用の譜面キーを生成する。
 *
 * @param songId - 楽曲ID。
 * @param difficulty - 譜面難易度。
 * @returns 大文字難易度で正規化した譜面キー。
 */
const createChartKey = (songId: string, difficulty: string): string =>
  `${songId}:${difficulty.toUpperCase()}`

/**
 * ベスト枠採用率を指定桁数で切り捨てたパーセント表記へ整形する。
 *
 * @param percentage - APIが返す0から100までの採用率。
 * @returns 小数点以下を固定桁数にしたパーセント記号付き表示文字列。
 */
const formatPercentage = (percentage: number): string =>
  `${formatTruncatedFixed(percentage, BEST_SLOT_PERCENTAGE_DECIMAL_PLACES)}%`

/**
 * ランキングの譜面1件を表形式で表示する。
 *
 * @param props.entry - 表示対象のランキング項目。
 * @param props.ownScore - 同じ譜面におけるログインユーザーのスコア。
 * @returns 順位、譜面情報、平均スコア、自分との差、採用率を含む行。
 */
const BestSlotRankingRow = (props: {
  entry: BestSlotRankingEntryDTO
  ownScore: number | undefined
}) => {
  const percentageBarWidth = () => `${Math.min(100, props.entry.best_player_percentage)}%`
  const constDisplay = () =>
    getConstDisplay(props.entry.chart.const, props.entry.chart.is_const_unknown)
  const averageScore = () =>
    props.entry.average_score === null ? undefined : Math.trunc(props.entry.average_score)
  const scoreDifference = () =>
    calculateDisplayedScoreDifference(props.ownScore, props.entry.average_score)

  return (
    <tr class="border-t border-border hover:bg-surface-muted">
      <th scope="row" class="w-7 p-0 text-center font-normal">
        <span
          class={`ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full font-oswald text-sm font-semibold ${getRankingPositionClass(
            props.entry.rank,
            'bg-surface-muted text-text-muted'
          )}`}
        >
          {props.entry.rank}
        </span>
      </th>
      <td class="relative min-w-64 p-0">
        <A
          href={buildSongDetailPath(props.entry.song.id, props.entry.chart.difficulty)}
          class="group absolute inset-0 flex min-w-0 items-center gap-2 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
        >
          <RecordDifficultyBadge difficulty={props.entry.chart.difficulty} />
          <span
            class="block max-w-48 truncate font-sans font-medium text-text group-hover:underline group-focus-visible:underline sm:max-w-96"
            title={props.entry.song.title}
          >
            {props.entry.song.title}
          </span>
        </A>
      </td>
      <td class="w-px px-2 py-2 text-center font-jost text-sm whitespace-nowrap">
        <span class={`leading-none ${constDisplay().className}`}>
          {constDisplay().valueText}
          <Show when={constDisplay().markerText}>
            {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
          </Show>
        </span>
      </td>
      <td class="w-px px-3 py-2 whitespace-nowrap">
        <div class="text-right font-jost text-sm tabular-nums">
          {averageScore() === undefined ? '-' : formatInteger(averageScore() ?? 0)}
        </div>
      </td>
      <td class="w-px px-3 py-2 text-right font-jost text-xs whitespace-nowrap tabular-nums">
        <Show when={scoreDifference() !== undefined} fallback="-">
          <span class={getScoreDifferenceClass(scoreDifference() ?? 0)}>
            {formatScoreDifference(scoreDifference() ?? 0)}
          </span>
        </Show>
      </td>
      <td class="min-w-36 px-3 py-2">
        <div class="flex items-center gap-3">
          <div
            class="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-muted"
            aria-hidden="true"
          >
            <div
              class="h-full rounded-full bg-action-primary"
              style={{ width: percentageBarWidth() }}
            />
          </div>
          <span class="w-16 text-right font-jost text-sm font-semibold whitespace-nowrap">
            {formatPercentage(props.entry.best_player_percentage)}
          </span>
        </div>
      </td>
    </tr>
  )
}

/**
 * ベスト枠平均レート帯別の譜面採用率ランキングを表示する。
 *
 * @returns レート帯選択、集計概要、カーソルページング付きランキング表。
 */
const BestSlotRankingPage = () => {
  const [ratingBandsResource] = createResource(fetchRatingBands)
  const [ownRating] = createResource(
    () => (authSession.status === 'authenticated' ? authSession.user?.username : null),
    fetchUserRatingWithCache
  )
  const [ownRecords] = createResource(
    () => (authSession.status === 'authenticated' ? authSession.user?.username : null),
    fetchUserRecordWithCache
  )
  const [selectedRatingBand, setSelectedRatingBand] = createSignal<RatingBandOption | null>(null)
  const [hasResolvedInitialBand, setHasResolvedInitialBand] = createSignal(false)
  const [additionalEntries, setAdditionalEntries] = createSignal<BestSlotRankingEntryDTO[]>([])
  const [nextCursor, setNextCursor] = createSignal<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = createSignal(false)
  const [loadMoreError, setLoadMoreError] = createSignal<unknown>()
  /** レート帯の選択セッションごとに追加取得結果を識別する世代番号。 */
  let paginationRequestVersion = 0

  const ratingBands = createMemo<RatingBandDTO[]>(() => ratingBandsResource() ?? [])
  const ratingBandOptions = createMemo<RatingBandOption[]>(() =>
    [...ratingBands().filter((band) => band.label !== ALL_RATING_BAND_LABEL)]
      .sort((left, right) => right.sort_order - left.sort_order)
      .map((band) => ({ label: band.label, value: band.label }))
  )

  createEffect(() => {
    if (hasResolvedInitialBand() || ratingBands().length === 0) return
    if (authSession.status === 'unknown') return
    if (authSession.status === 'authenticated' && ownRating.loading) return

    const initialBand = resolveInitialBestSlotRatingBand(
      ratingBands(),
      authSession.status === 'authenticated' && !ownRating.error ? ownRating()?.best_average : null
    )
    if (!initialBand) return

    setSelectedRatingBand({ label: initialBand.label, value: initialBand.label })
    setHasResolvedInitialBand(true)
  })

  const [ranking] = createResource(
    () => selectedRatingBand()?.value,
    (ratingBand) => fetchBestSlotRanking({ ratingBand })
  )

  createEffect(
    on(
      () => selectedRatingBand()?.value,
      () => {
        paginationRequestVersion += 1
        setAdditionalEntries([])
        setNextCursor(null)
        setIsLoadingMore(false)
        setLoadMoreError(undefined)
      }
    )
  )

  createEffect(() => {
    const response = ranking()
    if (response && response.rating_band === selectedRatingBand()?.value) {
      setNextCursor(response.next_cursor)
    }
  })

  const currentRanking = createMemo(() => {
    const response = ranking()
    return response?.rating_band === selectedRatingBand()?.value ? response : undefined
  })
  const displayedEntries = createMemo(() => [
    ...(currentRanking()?.ranking ?? []),
    ...additionalEntries(),
  ])
  const ownRecordsByChart = createMemo(
    () =>
      new Map<string, PlayerRecordDTO>(
        (ownRecords()?.standard ?? [])
          .filter((record) => record.is_played)
          .map((record) => [createChartKey(record.id, record.difficulty), record])
      )
  )

  /** 選択中レート帯のランキングを次のカーソルから追加取得する。 */
  const handleLoadMore = async (): Promise<void> => {
    const ratingBand = selectedRatingBand()?.value
    const cursor = nextCursor()
    if (!ratingBand || !cursor || isLoadingMore()) return
    const requestVersion = paginationRequestVersion

    setIsLoadingMore(true)
    setLoadMoreError(undefined)
    try {
      const response = await fetchBestSlotRanking({ ratingBand, cursor })
      if (
        paginationRequestVersion !== requestVersion ||
        selectedRatingBand()?.value !== ratingBand
      ) {
        return
      }

      setAdditionalEntries((current) => [...current, ...response.ranking])
      setNextCursor(response.next_cursor)
    } catch (error) {
      if (
        paginationRequestVersion === requestVersion &&
        selectedRatingBand()?.value === ratingBand
      ) {
        setLoadMoreError(error)
      }
    } finally {
      if (paginationRequestVersion === requestVersion) setIsLoadingMore(false)
    }
  }

  useDocumentTitle(BEST_SLOT_RANKING_COPY.title)

  return (
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 class="text-2xl font-semibold">{BEST_SLOT_RANKING_COPY.title}</h1>
        <Show when={selectedRatingBand()}>
          <AppSelect<RatingBandOption>
            options={ratingBandOptions()}
            optionValue="value"
            optionTextValue="label"
            value={selectedRatingBand()}
            onChange={(option) => option && setSelectedRatingBand(option)}
            label={BEST_SLOT_RANKING_COPY.ratingBandLabel}
            rootClass="w-full sm:w-52"
            triggerClass="h-10"
            formatLabel={(option) => option.label}
          />
        </Show>
      </div>

      <Show
        when={!ratingBandsResource.error}
        fallback={<LoadError error={ratingBandsResource.error} />}
      >
        <Show
          when={selectedRatingBand() && !ranking.loading}
          fallback={
            <div class="h-40">
              <Loading />
            </div>
          }
        >
          <Show when={!ranking.error} fallback={<LoadError error={ranking.error} />}>
            <Show when={currentRanking()}>
              <Show
                when={displayedEntries().length > 0}
                fallback={
                  <p class="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-muted">
                    {BEST_SLOT_RANKING_COPY.empty}
                  </p>
                }
              >
                <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                  <table class="w-full border-collapse text-left">
                    <caption class="sr-only">{BEST_SLOT_RANKING_COPY.tableCaption}</caption>
                    <colgroup>
                      <col class="w-7" />
                    </colgroup>
                    <thead class="sr-only">
                      <tr>
                        <th scope="col" class="px-3 py-2 text-center font-medium">
                          {BEST_SLOT_RANKING_COPY.rankColumn}
                        </th>
                        <th scope="col" class="px-3 py-2 font-medium">
                          {BEST_SLOT_RANKING_COPY.chartColumn}
                        </th>
                        <th scope="col" class="px-2 py-2 text-center font-medium">
                          {BEST_SLOT_RANKING_COPY.constColumn}
                        </th>
                        <th scope="col" class="px-3 py-2 text-right font-medium whitespace-nowrap">
                          {BEST_SLOT_RANKING_COPY.averageScoreColumn}
                        </th>
                        <th scope="col" class="px-3 py-2 text-right font-medium whitespace-nowrap">
                          {BEST_SLOT_RANKING_COPY.scoreDifferenceColumn}
                        </th>
                        <th scope="col" class="px-3 py-2 text-right font-medium">
                          {BEST_SLOT_RANKING_COPY.percentageColumn}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={displayedEntries()}>
                        {(entry) => (
                          <BestSlotRankingRow
                            entry={entry}
                            ownScore={
                              ownRecordsByChart().get(
                                createChartKey(entry.song.id, entry.chart.difficulty)
                              )?.score
                            }
                          />
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>

              <Show when={loadMoreError()}>{(error) => <LoadError error={error()} />}</Show>
              <Show
                when={!isLoadingMore()}
                fallback={
                  <div class="h-20">
                    <Loading />
                  </div>
                }
              >
                <Show when={nextCursor()}>
                  <div class="flex justify-center">
                    <AppButton variant="surface" onClick={handleLoadMore}>
                      {BEST_SLOT_RANKING_COPY.loadMore}
                    </AppButton>
                  </div>
                </Show>
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default BestSlotRankingPage
