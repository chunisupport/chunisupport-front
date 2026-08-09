import { Collapsible } from '@kobalte/core/collapsible'
import { A } from '@solidjs/router'
import { Gauge, TrendingUp } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, For, Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { AppDisclosureTrigger } from '../../components/common/AppDisclosureTrigger'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { RATING_SLOT_COUNT } from '../../constants/rating'
import { buildSongDetailPath } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useNewSongTheoreticalRating } from '../../hooks/useNewSongTheoreticalRating'
import { authSession } from '../../stores/authSession'
import type { PlayerRecordDTO } from '../../types/api'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { formatChartConst } from '../../utils/chartConstFormat'
import type {
  NewSongTheoreticalRating,
  NewSongTheoreticalRatingEntry,
} from '../../utils/newSongTheoreticalRating'
import {
  calculateNewSongTheoreticalRatingGap,
  resolveNewSongTheoreticalRatingProgress,
} from '../../utils/newSongTheoreticalRating'
import { formatInteger } from '../../utils/numberFormat'
import { formatPlayerRating, formatRatingFixed2 } from '../../utils/ratingFormat'
import { formatScoreDifference } from '../../utils/scoreDifference'
import { NEW_SONG_SSS_PLUS_COPY } from './newSongSssPlus.constants'

type Props = {
  candidateRecords: readonly PlayerRecordDTO[]
  currentRating: number | null
  currentRecords: readonly PlayerRecordDTO[]
  error: unknown
  loading: boolean
  theoreticalRating: NewSongTheoreticalRating | undefined
}

type RatingMetricProps = {
  icon: JSX.Element
  label: string
  unknown: boolean
  value: string
}

/**
 * 新曲枠のレーティング指標をアイコン付きで表示する。
 *
 * @param props - 指標のアイコン、ラベル、表示値、推定値状態。
 * @returns 新曲枠サマリー内の1指標。
 */
const RatingMetric: Component<RatingMetricProps> = (props) => (
  <div class="flex min-w-0 flex-col items-center justify-center gap-1 px-3 py-3 text-center">
    <p class="flex items-center gap-1.5 whitespace-nowrap font-sans text-xs font-medium text-text-muted">
      {props.icon}
      {props.label}
    </p>
    <p
      class="font-jost text-xl font-bold tabular-nums text-text data-[unknown=true]:italic data-[unknown=true]:text-danger"
      data-unknown={props.unknown}
    >
      {props.value}
      <Show when={props.unknown}>
        <sup
          class="ml-0.5 align-super font-sans text-[0.55em]"
          title={NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}
          aria-hidden="true"
        >
          {NEW_SONG_SSS_PLUS_COPY.unknownMarker}
        </sup>
        <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
      </Show>
    </p>
  </div>
)

/**
 * SSS+対象譜面の現在スコアとSSS+ボーダーとの差を表示する。
 *
 * @param props - 対象譜面と現在の新曲枠・候補枠レコード。
 * @returns 現在スコアの所属、スコア、SSS+ボーダーとの差。
 */
const SssPlusChartProgress: Component<{
  candidateRecords: readonly PlayerRecordDTO[]
  currentRecords: readonly PlayerRecordDTO[]
  entry: NewSongTheoreticalRatingEntry
}> = (props) => {
  const progress = createMemo(() => {
    const resolved = resolveNewSongTheoreticalRatingProgress(
      props.entry,
      props.currentRecords,
      props.candidateRecords
    )
    if (resolved.slot === null || resolved.currentScore === null || resolved.scoreGap === null) {
      return undefined
    }
    return {
      slot: resolved.slot,
      currentScore: resolved.currentScore,
      scoreGap: resolved.scoreGap,
    }
  })

  return (
    <span class="col-span-2 col-start-3 flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-0.5 font-oswald text-xs tabular-nums text-text-muted">
      <Show
        when={progress()}
        keyed
        fallback={
          <span class="font-sans text-text-subtle">{NEW_SONG_SSS_PLUS_COPY.recordUnavailable}</span>
        }
      >
        {(current) => (
          <>
            <span class="whitespace-nowrap">
              <Show when={current.slot === 'new_candidate'}>
                <span class="mr-1 rounded bg-surface-hover px-1 py-0.5 font-sans text-[0.65rem]">
                  {NEW_SONG_SSS_PLUS_COPY.candidateSlotLabel}
                </span>
              </Show>
              <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.currentScoreLabel}</span>
              {formatInteger(current.currentScore)}
            </span>
            <span class="whitespace-nowrap text-rating-candidate-gap">
              <span class="mr-1 font-sans text-text-muted">
                {NEW_SONG_SSS_PLUS_COPY.scoreGapLabel}
              </span>
              {formatScoreDifference(current.scoreGap)}
            </span>
          </>
        )}
      </Show>
    </span>
  )
}

/**
 * 新曲枠で全譜面SSS+時に採用される譜面を単曲レーティング順に表示する。
 *
 * @param props - SSS+時に採用される譜面一覧と現在の新曲枠・候補枠レコード。
 * @returns 楽曲詳細へ遷移できる折りたたみ一覧。
 */
const SssPlusChartList: Component<{
  candidateRecords: readonly PlayerRecordDTO[]
  currentRecords: readonly PlayerRecordDTO[]
  entries: NewSongTheoreticalRating['entries']
}> = (props) => (
  <Collapsible class="border-t border-border" defaultOpen>
    <AppDisclosureTrigger
      label={NEW_SONG_SSS_PLUS_COPY.detailsLabel}
      summary={`${props.entries.length}${NEW_SONG_SSS_PLUS_COPY.chartCountSuffix}`}
      class="py-1"
    />
    <Collapsible.Content>
      <ol class="divide-y divide-border border-t border-border">
        <For each={props.entries}>
          {(entry, index) => (
            <li>
              <A
                href={buildSongDetailPath(entry.songId, entry.difficulty)}
                class="grid grid-cols-[1.5rem_1.75rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-inherit hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
              >
                <span class="text-center font-oswald text-sm font-semibold text-text-muted">
                  {index() + 1}
                </span>
                <RecordDifficultyBadge difficulty={entry.difficulty} />
                <span class="min-w-0 font-sans">
                  <span class="block truncate text-sm font-semibold text-text">{entry.title}</span>
                  <span class="block truncate text-xs text-text-muted">{entry.artist}</span>
                </span>
                <span class="text-right font-oswald tabular-nums">
                  <span class="block text-base font-bold text-text">
                    <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.singleRatingLabel}</span>
                    {formatRatingFixed2(entry.rating)}
                  </span>
                  <span
                    class="block text-xs text-text-muted data-[unknown=true]:italic data-[unknown=true]:text-danger"
                    data-unknown={entry.isChartConstantUnknown}
                  >
                    <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.chartConstantLabel}</span>
                    {formatChartConst(entry.chartConstant)}
                    <Show when={entry.isChartConstantUnknown}>
                      <sup
                        class="ml-0.5 align-super font-sans text-[0.65em]"
                        title={NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}
                        aria-hidden="true"
                      >
                        {NEW_SONG_SSS_PLUS_COPY.unknownMarker}
                      </sup>
                      <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
                    </Show>
                  </span>
                </span>
                <SssPlusChartProgress
                  candidateRecords={props.candidateRecords}
                  currentRecords={props.currentRecords}
                  entry={entry}
                />
              </A>
            </li>
          )}
        </For>
      </ol>
    </Collapsible.Content>
  </Collapsible>
)

/**
 * 新曲枠の全譜面SSS+時レーティングと現在値からの差を表示する。
 *
 * @param props - 現在値、SSS+時レーティング、現在レコード、楽曲データの取得状態。
 * @returns 新曲枠SSS+対象のサマリー。
 */
const NewSongSssPlusSummary: Component<Props> = (props) => {
  const ratingGap = () =>
    props.theoreticalRating
      ? calculateNewSongTheoreticalRatingGap(props.theoreticalRating.rating, props.currentRating)
      : undefined
  const formattedRatingGap = () => {
    const gap = ratingGap()
    return gap === undefined ? NEW_SONG_SSS_PLUS_COPY.emptyValue : formatPlayerRating(gap)
  }

  return (
    <section
      class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
      aria-label={NEW_SONG_SSS_PLUS_COPY.ariaLabel}
    >
      <Show
        when={!props.error}
        fallback={
          <div class="p-3">
            <LoadError error={props.error} />
          </div>
        }
      >
        <Show
          when={!props.loading}
          fallback={
            <div class="h-20 py-3">
              <Loading size="inline" ariaLabel={NEW_SONG_SSS_PLUS_COPY.loadingLabel} />
            </div>
          }
        >
          <Show
            when={props.theoreticalRating}
            fallback={
              <p class="px-3 py-4 text-center font-sans text-sm text-text-subtle">
                {NEW_SONG_SSS_PLUS_COPY.noData}
              </p>
            }
          >
            {(theoreticalRating) => (
              <>
                <div class="grid grid-cols-2 divide-x divide-border">
                  <RatingMetric
                    icon={<Gauge class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_SSS_PLUS_COPY.targetRating}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formatPlayerRating(theoreticalRating().rating)}
                  />
                  <RatingMetric
                    icon={<TrendingUp class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_SSS_PLUS_COPY.currentGap}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formattedRatingGap()}
                  />
                </div>
                <SssPlusChartList
                  candidateRecords={props.candidateRecords}
                  currentRecords={props.currentRecords}
                  entries={theoreticalRating().entries}
                />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </section>
  )
}

/**
 * ログインユーザーの新曲枠に対するSSS+対象譜面と現在スコア差を表示する。
 *
 * @returns 新曲枠SSS+チェッカーのツールページ。
 */
const NewSongSssPlusToolPage: Component = () => {
  const username = (): string | undefined =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const [rating] = createResource(username, fetchUserRatingWithCache)
  const sssPlusRating = useNewSongTheoreticalRating(() => true, RATING_SLOT_COUNT.new)

  useDocumentTitle(NEW_SONG_SSS_PLUS_COPY.title)

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Gauge class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{NEW_SONG_SSS_PLUS_COPY.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{NEW_SONG_SSS_PLUS_COPY.description}</p>
        </div>
      </header>

      <NewSongSssPlusSummary
        currentRating={rating()?.new_average ?? null}
        currentRecords={rating()?.new ?? []}
        candidateRecords={rating()?.new_candidate ?? []}
        error={rating.error ?? sssPlusRating.error()}
        loading={rating.loading || sssPlusRating.isLoading()}
        theoreticalRating={sssPlusRating.theoreticalRating()}
      />
    </div>
  )
}

export default NewSongSssPlusToolPage
