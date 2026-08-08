import { Collapsible } from '@kobalte/core/collapsible'
import { A } from '@solidjs/router'
import { Gauge, TrendingUp } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { AppDisclosureTrigger } from '../../../../components/common/AppDisclosureTrigger'
import { RecordDifficultyBadge } from '../../../../components/common/record/RecordBadges'
import { buildSongDetailPath } from '../../../../constants/routes'
import { formatChartConst } from '../../../../utils/chartConstFormat'
import type { NewSongTheoreticalRating } from '../../../../utils/newSongTheoreticalRating'
import { calculateNewSongTheoreticalRatingGap } from '../../../../utils/newSongTheoreticalRating'
import { formatPlayerRating, formatRatingFixed2 } from '../../../../utils/ratingFormat'
import { NEW_SONG_RATING_SUMMARY_COPY } from '../UserProfileView.constants'

type Props = {
  currentRating: number | null
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
          title={NEW_SONG_RATING_SUMMARY_COPY.unknownChartConstant}
          aria-hidden="true"
        >
          {NEW_SONG_RATING_SUMMARY_COPY.unknownMarker}
        </sup>
        <span class="sr-only">{NEW_SONG_RATING_SUMMARY_COPY.unknownChartConstant}</span>
      </Show>
    </p>
  </div>
)

/**
 * 新曲枠理論値へ採用された譜面を単曲レーティング順に表示する。
 *
 * @param props - 理論値へ採用された譜面一覧。
 * @returns 楽曲詳細へ遷移できる折りたたみ一覧。
 */
const TheoreticalChartList: Component<{
  entries: NewSongTheoreticalRating['entries']
}> = (props) => (
  <Collapsible class="border-t border-border" defaultOpen={false}>
    <AppDisclosureTrigger
      label={NEW_SONG_RATING_SUMMARY_COPY.detailsLabel}
      summary={`${props.entries.length}${NEW_SONG_RATING_SUMMARY_COPY.chartCountSuffix}`}
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
                    <span class="sr-only">{NEW_SONG_RATING_SUMMARY_COPY.singleRatingLabel}</span>
                    {formatRatingFixed2(entry.rating)}
                  </span>
                  <span
                    class="block text-xs text-text-muted data-[unknown=true]:italic data-[unknown=true]:text-danger"
                    data-unknown={entry.isChartConstantUnknown}
                  >
                    <span class="sr-only">{NEW_SONG_RATING_SUMMARY_COPY.chartConstantLabel}</span>
                    {formatChartConst(entry.chartConstant)}
                    <Show when={entry.isChartConstantUnknown}>
                      <sup
                        class="ml-0.5 align-super font-sans text-[0.65em]"
                        title={NEW_SONG_RATING_SUMMARY_COPY.unknownChartConstant}
                        aria-hidden="true"
                      >
                        {NEW_SONG_RATING_SUMMARY_COPY.unknownMarker}
                      </sup>
                      <span class="sr-only">
                        {NEW_SONG_RATING_SUMMARY_COPY.unknownChartConstant}
                      </span>
                    </Show>
                  </span>
                </span>
              </A>
            </li>
          )}
        </For>
      </ol>
    </Collapsible.Content>
  </Collapsible>
)

/**
 * 新曲枠レーティングの理論値と現在値からの差を表示する。
 *
 * @param props - 現在値、理論値、楽曲データの取得状態。
 * @returns 新曲枠の理論値サマリー。
 */
export const NewSongRatingSummary: Component<Props> = (props) => {
  const ratingGap = () =>
    props.theoreticalRating
      ? calculateNewSongTheoreticalRatingGap(props.theoreticalRating.rating, props.currentRating)
      : undefined
  const formattedRatingGap = () => {
    const gap = ratingGap()
    return gap === undefined ? NEW_SONG_RATING_SUMMARY_COPY.emptyValue : formatPlayerRating(gap)
  }

  return (
    <section
      class="mx-4 mb-4 overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
      aria-label={NEW_SONG_RATING_SUMMARY_COPY.ariaLabel}
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
              <Loading size="inline" ariaLabel={NEW_SONG_RATING_SUMMARY_COPY.loadingLabel} />
            </div>
          }
        >
          <Show
            when={props.theoreticalRating}
            fallback={
              <p class="px-3 py-4 text-center font-sans text-sm text-text-subtle">
                {NEW_SONG_RATING_SUMMARY_COPY.noData}
              </p>
            }
          >
            {(theoreticalRating) => (
              <>
                <div class="grid grid-cols-2 divide-x divide-border">
                  <RatingMetric
                    icon={<Gauge class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_RATING_SUMMARY_COPY.theoreticalRating}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formatPlayerRating(theoreticalRating().rating)}
                  />
                  <RatingMetric
                    icon={<TrendingUp class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_RATING_SUMMARY_COPY.currentGap}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formattedRatingGap()}
                  />
                </div>
                <TheoreticalChartList entries={theoreticalRating().entries} />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </section>
  )
}
