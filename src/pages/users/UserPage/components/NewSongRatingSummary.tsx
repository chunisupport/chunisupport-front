import { Gauge, TrendingUp } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import type { NewSongTheoreticalRating } from '../../../../utils/newSongTheoreticalRating'
import { calculateNewSongTheoreticalRatingGap } from '../../../../utils/newSongTheoreticalRating'
import { formatPlayerRating } from '../../../../utils/ratingFormat'
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
        >
          ?
        </sup>
      </Show>
    </p>
  </div>
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
            )}
          </Show>
        </Show>
      </Show>
    </section>
  )
}
